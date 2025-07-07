import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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

    // Generar secreto TOTP para el admin
    const secret = authenticator.generateSecret();
    
    // Obtener usuario admin
    const userQuery = `
      SELECT id, email, name
      FROM "User" 
      WHERE email = 'admin@zaro.com'
    `;
    
    const userResult = await client.query(userQuery);

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario admin no encontrado' }),
      };
    }

    const user = userResult.rows[0];

    // Actualizar usuario con secreto TOTP
    const updateQuery = `
      UPDATE "User" 
      SET "twoFactorSecret" = $1, "twoFactorEnabled" = true
      WHERE id = $2
    `;
    await client.query(updateQuery, [secret, user.id]);

    // Generar URL para QR
    const serviceName = 'Zaro Certificados';
    const accountName = user.email;
    const otpauth = authenticator.keyuri(accountName, serviceName, secret);

    // Generar código QR
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Secreto TOTP generado para admin@zaro.com',
        user: {
          email: user.email,
          name: user.name
        },
        totp: {
          secret,
          qrCode: qrCodeDataURL,
          manualEntryKey: secret,
          serviceName,
          accountName,
          instructions: 'Escanea el código QR con Google Authenticator o ingresa manualmente la clave'
        }
      }),
    };

  } catch (error) {
    console.error('Error generando TOTP para admin:', error);
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
