import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado para debug de access_logs');

    // 1. Verificar que la tabla existe y su estructura
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_logs'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'La tabla access_logs no existe'
        })
      };
    }

    // 2. Obtener estructura de la tabla
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
      ORDER BY ordinal_position
    `);

    // 3. Contar registros totales
    const totalCount = await client.query('SELECT COUNT(*) as total FROM access_logs');

    // 4. Obtener últimos 5 registros
    const recentLogs = await client.query(`
      SELECT 
        id,
        user_id,
        login_time,
        success,
        two_factor_used,
        device_type,
        browser,
        created_at
      FROM access_logs 
      ORDER BY COALESCE(login_time, created_at) DESC 
      LIMIT 5
    `);

    // 5. Verificar usuarios activos
    const activeUsers = await client.query('SELECT COUNT(*) as total FROM users');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tableExists: true,
        structure: structure.rows,
        totalLogs: parseInt(totalCount.rows[0].total),
        totalUsers: parseInt(activeUsers.rows[0].total),
        recentLogs: recentLogs.rows,
        debug: {
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
    };

  } catch (error) {
    console.error('❌ Error en debug-access-logs:', error);
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
