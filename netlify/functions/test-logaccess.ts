import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import { logAccess } from './utils/accessLogger';

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
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  let client: Client | null = null;

  try {
    // Conectar a la base de datos
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    console.log('🧪 Test de logAccess iniciado');

    // Intentar registrar un acceso de prueba
    await logAccess(client, {
      userId: 1, // ID del admin
      ipAddress: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || '127.0.0.1',
      userAgent: event.headers['user-agent'] || 'Test User Agent',
      status: 'success',
      twoFactorUsed: false
    });

    // Verificar que se insertó
    const result = await client.query(`
      SELECT * FROM access_logs 
      WHERE user_id = 1 
      ORDER BY login_time DESC 
      LIMIT 1
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test de logAccess completado',
        lastEntry: result.rows[0] || null,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error en test de logAccess:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error en test de logAccess',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
