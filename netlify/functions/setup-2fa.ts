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
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let client: Client | null = null;

  try {
    // Verificar token de autenticación
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token de autorización requerido' }),
      };
    }

    const token = authHeader.substring(7);
    let decodedToken: DecodedToken;
    
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    const userId = decodedToken.userId;

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

    if (event.httpMethod === 'GET') {
      // Obtener configuración actual del 2FA
      const userQuery = `
        SELECT id, email, name, "twoFactorEnabled", "twoFactorSecret"
        FROM "User" 
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          twoFactorEnabled: user.twoFactorEnabled,
          hasSecret: !!user.twoFactorSecret
        }),
      };

    } else if (event.httpMethod === 'POST') {
      // Configurar o regenerar 2FA
      const { action } = JSON.parse(event.body || '{}');

      if (action === 'setup') {
        // Generar nuevo secreto TOTP
        const secret = authenticator.generateSecret();
        
        // Buscar información del usuario
        const userQuery = `
          SELECT id, email, name
          FROM "User" 
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

        // Generar URL para QR
        const serviceName = 'Zaro Certificados';
        const accountName = user.email;
        const otpauth = authenticator.keyuri(accountName, serviceName, secret);

        // Generar código QR
        const qrCodeDataURL = await QRCode.toDataURL(otpauth);

        // Guardar el secreto temporalmente (no habilitar 2FA hasta confirmación)
        const updateQuery = `
          UPDATE "User" 
          SET "twoFactorSecret" = $1
          WHERE id = $2
        `;
        await client.query(updateQuery, [secret, userId]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            secret,
            qrCode: qrCodeDataURL,
            manualEntryKey: secret,
            serviceName,
            accountName
          }),
        };

      } else if (action === 'enable') {
        // Habilitar 2FA después de verificar código
        const { code } = JSON.parse(event.body || '{}');

        if (!code) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Código de verificación requerido' }),
          };
        }

        // Obtener el secreto temporal
        const userQuery = `
          SELECT id, email, "twoFactorSecret"
          FROM "User" 
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

        if (!user.twoFactorSecret) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Debes configurar 2FA primero' }),
          };
        }

        // Verificar código TOTP
        const isValidCode = authenticator.verify({
          token: code,
          secret: user.twoFactorSecret
        });

        if (!isValidCode) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Código incorrecto' }),
          };
        }

        // Habilitar 2FA
        const updateQuery = `
          UPDATE "User" 
          SET "twoFactorEnabled" = true
          WHERE id = $1
        `;
        await client.query(updateQuery, [userId]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: '2FA habilitado correctamente'
          }),
        };

      } else if (action === 'disable') {
        // Deshabilitar 2FA
        const updateQuery = `
          UPDATE "User" 
          SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL
          WHERE id = $1
        `;
        await client.query(updateQuery, [userId]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: '2FA deshabilitado correctamente'
          }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Acción no válida' }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Método no válido' }),
    };

  } catch (error) {
    console.error('Error en setup-2fa:', error);
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
