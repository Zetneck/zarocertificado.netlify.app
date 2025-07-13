import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });


  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_logs'
      ) as exists;
    `);
    if (!tableExists.rows[0].exists) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'La tabla access_logs NO existe en la base de datos',
          details: tableExists.rows[0]
        }, null, 2)
      };
    }

    // Verificar estructura de la tabla
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
      ORDER BY ordinal_position
    `);

    // Obtener últimos 10 registros
    const logs = await client.query(`
      SELECT id, user_id, ip_address, login_time, created_at, success, device_type, browser, user_agent
      FROM access_logs 
      ORDER BY COALESCE(login_time, created_at) DESC 
      LIMIT 10
    `);

    // Diagnóstico de IPs y registros
    const logsDiagnostico = logs.rows.map(log => ({
      ...log,
      ip_status: !log.ip_address ? '❌ VACÍO' : (log.ip_address === '::1' || log.ip_address === '127.0.0.1') ? '⚠️ LOCAL' : '✅',
      login_time: log.login_time ? log.login_time : null,
      created_at: log.created_at ? log.created_at : null
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tablaExiste: true,
        estructura: structure.rows,
        totalRegistros: logs.rows.length,
        logs: logsDiagnostico
      }, null, 2)
    };
  } catch (error) {
    console.error('❌ Error conectando o consultando la base de datos:', error);
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
