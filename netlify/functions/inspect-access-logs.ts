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

  if (event.httpMethod !== 'GET') {
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

    console.log('🔍 Inspeccionando tabla access_logs...');

    // 1. Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'access_logs'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Tabla access_logs no existe',
          tableExists: false,
          suggestions: ['Crear la tabla access_logs', 'Verificar migraciones de BD']
        })
      };
    }

    // 2. Verificar estructura de la tabla
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
      ORDER BY ordinal_position;
    `);

    // 3. Contar total de registros
    const totalCount = await client.query('SELECT COUNT(*) as total FROM access_logs');

    // 4. Obtener últimos 5 registros RAW de la BD
    const lastRecords = await client.query(`
      SELECT * FROM access_logs 
      ORDER BY 
        CASE 
          WHEN login_time IS NOT NULL THEN login_time 
          WHEN created_at IS NOT NULL THEN created_at 
          ELSE NOW() 
        END DESC 
      LIMIT 5
    `);

    // 5. Verificar registros de las últimas 24 horas
    const recentRecords = await client.query(`
      SELECT COUNT(*) as recent_count FROM access_logs 
      WHERE 
        CASE 
          WHEN login_time IS NOT NULL THEN login_time > NOW() - INTERVAL '24 hours'
          WHEN created_at IS NOT NULL THEN created_at > NOW() - INTERVAL '24 hours'
          ELSE false
        END
    `);

    // 6. Verificar registros por usuario específico (admin)
    const adminRecords = await client.query(`
      SELECT COUNT(*) as admin_count FROM access_logs 
      WHERE user_id = 1
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        inspection: {
          tableExists: true,
          structure: tableStructure.rows,
          totalRecords: parseInt(totalCount.rows[0].total),
          recentRecords: parseInt(recentRecords.rows[0].recent_count),
          adminRecords: parseInt(adminRecords.rows[0].admin_count),
          lastRecords: lastRecords.rows,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Error inspeccionando access_logs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error inspeccionando tabla',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
