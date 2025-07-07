import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let client: Client | null = null;

  try {
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    const { confirmUpdate } = JSON.parse(event.body || '{}');
    
    if (confirmUpdate !== 'YES_UPDATE_PASSWORDS') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Para confirmar, envía: {"confirmUpdate": "YES_UPDATE_PASSWORDS"}',
          warning: 'Esta función actualizará las contraseñas de todos los usuarios'
        })
      };
    }

    // Generar nuevos hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);
    const operatorHash = await bcrypt.hash('operator123', 10);

    console.log('Actualizando contraseñas...');

    // Actualizar contraseñas
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [adminHash, 'admin@zaro.com']);
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [userHash, 'user@zaro.com']);
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [operatorHash, 'operator@zaro.com']);

    console.log('Contraseñas actualizadas exitosamente');

    // Verificar actualización
    const result = await client.query('SELECT email, password_hash FROM users ORDER BY email');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Contraseñas actualizadas exitosamente',
        users: result.rows.map(user => ({
          email: user.email,
          hashPrefix: user.password_hash.substring(0, 20) + '...',
          hashLength: user.password_hash.length
        })),
        newPasswords: {
          'admin@zaro.com': 'admin123',
          'user@zaro.com': 'user123',
          'operator@zaro.com': 'operator123'
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al actualizar contraseñas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
