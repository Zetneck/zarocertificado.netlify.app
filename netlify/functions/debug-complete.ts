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
    console.log('✅ Conectado para debug completo');

    // 1. Verificar estructura de access_logs
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
      ORDER BY ordinal_position
    `);

    // 2. Contar registros totales
    const totalCount = await client.query('SELECT COUNT(*) as total FROM access_logs');

    // 3. Obtener últimos 10 registros
    const recentLogs = await client.query(`
      SELECT 
        id,
        user_id,
        ip_address,
        success,
        two_factor_used,
        device_type,
        browser,
        login_time,
        created_at
      FROM access_logs 
      ORDER BY COALESCE(login_time, created_at) DESC 
      LIMIT 10
    `);

    // 4. Verificar usuarios únicos con accesos
    const uniqueUsers = await client.query(`
      SELECT 
        user_id, 
        COUNT(*) as access_count,
        MAX(COALESCE(login_time, created_at)) as last_access
      FROM access_logs 
      GROUP BY user_id 
      ORDER BY last_access DESC
    `);

    // 5. Verificar si hay registros nuevos (últimas 24 horas)
    const recentAccess = await client.query(`
      SELECT COUNT(*) as recent_count
      FROM access_logs 
      WHERE COALESCE(login_time, created_at) > NOW() - INTERVAL '24 hours'
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        database: {
          tableStructure: structure.rows,
          totalRecords: parseInt(totalCount.rows[0].total),
          recentRecords24h: parseInt(recentAccess.rows[0].recent_count),
          uniqueUsers: uniqueUsers.rows.length
        },
        recentLogs: recentLogs.rows.map(log => ({
          id: log.id,
          user_id: log.user_id,
          ip: log.ip_address,
          success: log.success,
          device: `${log.device_type || 'Unknown'} • ${log.browser || 'Unknown'}`,
          timestamp: log.login_time || log.created_at,
          formatted_time: new Date(log.login_time || log.created_at).toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City'
          })
        })),
        userSummary: uniqueUsers.rows
      })
    };

  } catch (error) {
    console.error('❌ Error en debug completo:', error);
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
