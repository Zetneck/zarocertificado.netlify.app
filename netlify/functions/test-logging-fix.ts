import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import { logAccess, getClientIP } from './utils/accessLogger';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  // Bloquear en producción
  if (process.env.NODE_ENV === 'production') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  }

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

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos para test de logging');

    // Verificar estructura de la tabla
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
      ORDER BY ordinal_position
    `);

    console.log('📋 Estructura de access_logs:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Obtener un usuario de ejemplo
    const userQuery = await client.query(`
      SELECT id, email FROM users LIMIT 1
    `);

    if (userQuery.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No hay usuarios en la base de datos' })
      };
    }

    const testUser = userQuery.rows[0];
    console.log('👤 Usuario de prueba:', testUser);

    // Intentar registrar acceso
    console.log('🧪 Intentando registrar acceso de prueba...');
    
    await logAccess(client, {
      userId: testUser.id,
      ipAddress: getClientIP(event),
      userAgent: event.headers['user-agent'] || 'Test User Agent',
      success: true,
      twoFactorUsed: false
    });

    // Verificar que se registró
    const recentLogs = await client.query(`
      SELECT * FROM access_logs 
      WHERE user_id = $1 
      ORDER BY login_time DESC 
      LIMIT 1
    `, [testUser.id]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test de logging completado',
        tableStructure: tableInfo.rows,
        testUser: testUser,
        recentLog: recentLogs.rows[0] || null,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error en test de logging:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  } finally {
    await client.end();
  }
};
