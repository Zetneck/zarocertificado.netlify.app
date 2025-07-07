import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro';

interface DecodedToken {
  id?: string;
  userId?: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let client: Client | null = null;

  try {
    let token: string;
    
    // Para usuarios nuevos (POST con tempToken) o usuarios existentes (GET con Authorization)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      token = body.tempToken;
      
      if (!token) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Token temporal requerido' }),
        };
      }
    } else {
      // GET request - obtener token de Authorization header
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Token de autorización requerido' }),
        };
      }
      token = authHeader.split(' ')[1];
    }

    console.log('Generando QR 2FA - método:', event.httpMethod, 'hasToken:', !!token);
    
    // Verificar token
    let decodedToken: DecodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as DecodedToken;
      console.log('Token decodificado exitosamente:', { userId: decodedToken.userId || decodedToken.id, email: decodedToken.email });
    } catch (error) {
      console.error('Error verificando token para QR:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Token inválido',
          message: 'El token ha expirado o es inválido. Por favor, inicia sesión nuevamente.'
        }),
      };
    }

    // Obtener userId (puede venir como 'id' o 'userId' dependiendo del token)
    const userId = decodedToken.userId || decodedToken.id;

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
      SELECT id, email, name, two_factor_secret, two_factor_enabled
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await client.query(userQuery, [userId]);

    console.log('Usuario query result:', { 
      found: userResult.rows.length > 0, 
      userId,
      query: 'users table'
    });

    if (userResult.rows.length === 0) {
      console.error('Usuario no encontrado en generate-2fa-qr:', { userId });
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario no encontrado' }),
      };
    }

    const user = userResult.rows[0];
    let secret = user.two_factor_secret;

    // Si no tiene secret, generar uno nuevo
    if (!secret) {
      console.log('Generando nuevo secret para usuario:', { userId, email: user.email });
      secret = authenticator.generateSecret();
      
      // Guardar secret en base de datos
      const updateQuery = `
        UPDATE users 
        SET two_factor_secret = $1
        WHERE id = $2
      `;
      await client.query(updateQuery, [secret, user.id]);
      console.log('Secret guardado en base de datos');
    } else {
      console.log('Usuario ya tiene secret configurado');
    }

    // Generar URI y QR code
    const serviceName = 'Zaro Certificado';
    const accountName = user.email;
    
    const otpauth = authenticator.keyuri(accountName, serviceName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        qrCode: qrCodeDataUrl,
        secret: secret,
        manual: `Secret: ${secret}`,
        serviceName: serviceName,
        accountName: accountName,
        instructions: [
          '1. Abre Google Authenticator en tu teléfono',
          '2. Toca el botón "+" para agregar una cuenta',
          '3. Selecciona "Escanear código QR"',
          '4. Escanea el código QR mostrado abajo',
          '5. El código de 6 dígitos aparecerá en tu aplicación'
        ]
      }),
    };

  } catch (error) {
    console.error('Error generando QR 2FA:', error);
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
