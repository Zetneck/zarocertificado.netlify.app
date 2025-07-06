import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let client: Client | null = null;

  try {
    // Probar conexión exactamente como en auth-login
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Attempting to connect with URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    await client.connect();
    console.log('Connected successfully');
    
    // Probar consulta simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Query result:', result.rows[0]);
    
    // Probar consulta de usuarios
    const userResult = await client.query('SELECT email, role FROM users LIMIT 3');
    console.log('Users found:', userResult.rows);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        currentTime: result.rows[0],
        users: userResult.rows,
        message: 'Conexión exitosa'
      })
    };

  } catch (error) {
    console.error('Error detallado:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error de conexión',
        details: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: error instanceof Error ? (error as Error & { code?: string }).code : 'N/A',
          host: error instanceof Error ? (error as Error & { hostname?: string }).hostname : 'N/A'
        }
      })
    };
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
};
