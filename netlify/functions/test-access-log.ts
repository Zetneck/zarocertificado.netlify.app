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
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  let client: Client | null = null;

  try {
    console.log('🧪 TEST ACCESS LOG - Iniciando prueba...');
    
    // Conectar a la base de datos
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Probar inserción de log de acceso
    await logAccess(client, {
      userId: 1, // ID de prueba - cambiar por ID real
      ipAddress: '127.0.0.1',
      userAgent: event.headers['user-agent'] || 'Test-Agent',
      status: 'success',
      twoFactorUsed: false
    });

    console.log('✅ Log de acceso insertado correctamente');

    // Verificar que se insertó
    const result = await client.query(`
      SELECT * FROM access_logs 
      WHERE user_id = 1 
      ORDER BY login_time DESC 
      LIMIT 3
    `);

    console.log('📊 Últimos registros:', result.rows);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test de inserción completado',
        lastRecords: result.rows,
        timestamp: new Date().toISOString(),
        userAgent: event.headers['user-agent']
      })
    };

  } catch (error) {
    console.error('❌ Error en test:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error en test de inserción',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
