import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  requiresTwoFactor?: boolean;
  needsSetup2FA?: boolean;
  iat?: number;
  exp?: number;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let client: Client | null = null;

  try {
    const { code, tempToken } = JSON.parse(event.body || '{}');

    console.log('Verificación 2FA iniciada:', { 
      hasCode: !!code, 
      hasTempToken: !!tempToken,
      codeLength: code?.length,
      tokenPreview: tempToken?.substring(0, 20) + '...'
    });

    if (!code || !tempToken) {
      console.error('Faltan parámetros requeridos:', { code: !!code, tempToken: !!tempToken });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Código y token temporal requeridos' }),
      };
    }

    // Verificar el token temporal
    let decodedToken: DecodedToken;
    try {
      console.log('Verificando token temporal:', tempToken.substring(0, 20) + '...');
      decodedToken = jwt.verify(tempToken, JWT_SECRET) as DecodedToken;
      console.log('Token decodificado exitosamente para usuario:', decodedToken.email);
    } catch (error) {
      console.error('Error verificando token temporal:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Token temporal inválido',
          message: 'El token de autenticación ha expirado o es inválido. Por favor, inicia sesión nuevamente.'
        }),
      };
    }

    const userId = decodedToken.id;

    // Conexión a Neon
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Buscar el usuario en la base de datos
    const userQuery = `
      SELECT id, email, name, role, phone, department, credits, 
             two_factor_enabled, two_factor_secret, settings, 
             created_at, last_login
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario no encontrado' }),
      };
    }

    const user = userResult.rows[0];

    console.log('Usuario encontrado:', { 
      userId: user.id, 
      email: user.email, 
      twoFactorEnabled: user.two_factor_enabled,
      hasSecret: !!user.two_factor_secret,
      tokenRequires: decodedToken.requiresTwoFactor || decodedToken.needsSetup2FA
    });

    // Para usuarios en proceso de configuración de 2FA, permitir verificación aunque no esté formalmente habilitado aún
    if (!user.two_factor_enabled && !user.two_factor_secret) {
      console.error('Usuario no tiene 2FA configurado:', { userId, email: user.email });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Usuario no tiene 2FA configurado',
          message: 'Debes configurar 2FA antes de poder verificar códigos.'
        }),
      };
    }

    // Verificar código TOTP real
    let isValidCode = false;
    
    if (user.two_factor_secret) {
      try {
        console.log('Verificando código TOTP:', { 
          userId, 
          email: user.email,
          codeLength: code.length,
          hasSecret: !!user.two_factor_secret
        });
        
        // Verificar código TOTP usando la secret del usuario
        isValidCode = authenticator.verify({
          token: code,
          secret: user.two_factor_secret
        });
        
        console.log('Resultado verificación TOTP:', { isValidCode, userId });
      } catch (error) {
        console.error('Error verificando TOTP:', error);
        isValidCode = false;
      }
    } else {
      console.error('Usuario no tiene secret 2FA:', { userId, email: user.email });
    }

    if (!isValidCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Código incorrecto',
          message: 'Código de verificación inválido. Ingresa el código de tu app autenticadora.'
        }),
      };
    }

    // Actualizar último login
    const updateQuery = `
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = $1
    `;
    await client.query(updateQuery, [userId]);

    // Generar token de autenticación final
    const authToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        twoFactorVerified: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Devolver usuario y token
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      department: user.department,
      credits: user.credits,
      twoFactorEnabled: user.two_factor_enabled,
      settings: user.settings || {},
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verificación 2FA exitosa',
        token: authToken,
        user: userResponse,
      }),
    };

  } catch (error) {
    console.error('Error en verify-2fa:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Error en procesamiento'
      }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
