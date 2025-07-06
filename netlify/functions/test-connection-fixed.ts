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
    const originalUrl = process.env.DATABASE_URL;
    
    if (!originalUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'DATABASE_URL no definida' })
      };
    }

    // Remover channel_binding=require de la URL
    const modifiedUrl = originalUrl.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    console.log('Intentando conectar con URL modificada:', modifiedUrl.substring(0, 50) + '...');
    
    // Probar conexión con URL modificada
    client = new Client({
      connectionString: modifiedUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('Conexión exitosa con URL modificada');
    
    // Probar consulta simple
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('Query ejecutada exitosamente');
    
    // Probar consulta de usuarios
    const userResult = await client.query('SELECT email, role, created_at FROM users LIMIT 3');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Conexión exitosa con URL modificada',
        currentTime: result.rows[0],
        users: userResult.rows,
        urlModification: 'Removido channel_binding=require'
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
