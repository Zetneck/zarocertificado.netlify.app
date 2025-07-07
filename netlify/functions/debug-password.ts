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
    
    const { email, password } = JSON.parse(event.body || '{}');
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email y contraseña requeridos' })
      };
    }

    // Obtener datos del usuario incluyendo hash
    const result = await client.query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }

    const user = result.rows[0];
    const storedHash = user.password_hash;
    
    // Verificar contraseña
    const isValid = await bcrypt.compare(password, storedHash);
    
    // También vamos a generar un nuevo hash para comparar
    const newHash = await bcrypt.hash(password, 10);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email: user.email,
        passwordProvided: password,
        storedHashPrefix: storedHash.substring(0, 20) + '...',
        passwordMatches: isValid,
        newHashGenerated: newHash.substring(0, 20) + '...',
        hashComparison: {
          storedLength: storedHash.length,
          newLength: newHash.length,
          storedPrefix: storedHash.substring(0, 7),
          newPrefix: newHash.substring(0, 7)
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al verificar contraseña',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
