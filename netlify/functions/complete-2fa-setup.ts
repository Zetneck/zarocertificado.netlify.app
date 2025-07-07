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

    console.log('=== COMPLETAR SETUP 2FA ===');
    console.log('Código recibido:', { hasCode: !!code, codeLength: code?.length });

    if (!code || !tempToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Código y token temporal requeridos' }),
      };
    }

    // Verificar el token temporal
    let decodedToken: DecodedToken;
    try {
      decodedToken = jwt.verify(tempToken, JWT_SECRET) as DecodedToken;
      console.log('Token decodificado para setup:', { userId: decodedToken.id, email: decodedToken.email });
    } catch (error) {
      console.error('Error verificando token temporal:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Token temporal inválido',
          message: 'El token ha expirado. Inicia sesión nuevamente.'
        }),
      };
    }

    const userId = decodedToken.id;

    // Conexión a base de datos
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Buscar usuario
    const userQuery = `
      SELECT id, email, name, role, phone, department, credits, 
             two_factor_enabled, two_factor_secret, settings, 
             created_at, last_login
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario no encontrado' }),
      };
    }

    const user = userResult.rows[0];

    console.log('Usuario para completar setup:', { 
      userId: user.id, 
      email: user.email, 
      hasSecret: !!user.two_factor_secret,
      isEnabled: user.two_factor_enabled
    });

    if (!user.two_factor_secret) {
      await client.end();
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No hay secret 2FA configurado',
          message: 'Primero debes generar el código QR.'
        }),
      };
    }

    // Verificar código TOTP
    let isValidCode = false;
    try {
      isValidCode = authenticator.verify({
        token: code,
        secret: user.two_factor_secret
      });
      
      console.log('Verificación TOTP para setup:', { isValidCode, userId, codeLength: code.length });
    } catch (error) {
      console.error('Error verificando TOTP en setup:', error);
      isValidCode = false;
    }

    if (!isValidCode) {
      await client.end();
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Código incorrecto',
          message: 'El código de verificación es inválido o ha expirado. Ingresa el código actual de tu app.'
        }),
      };
    }

    // HABILITAR 2FA y actualizar usuario
    const updateQuery = `
      UPDATE users 
      SET two_factor_enabled = true, last_login = NOW() 
      WHERE id = $1
    `;
    await client.query(updateQuery, [userId]);

    console.log('2FA habilitado exitosamente para usuario:', { userId, email: user.email });

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

    // Respuesta del usuario
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      department: user.department,
      credits: user.credits,
      twoFactorEnabled: true, // Ahora está habilitado
      settings: user.settings || {},
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
    };

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '2FA configurado y activado exitosamente',
        token: authToken,
        user: userResponse,
      }),
    };

  } catch (error) {
    console.error('Error en complete-2fa-setup:', error);
    if (client) {
      await client.end();
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Error en procesamiento'
      }),
    };
  }
};
