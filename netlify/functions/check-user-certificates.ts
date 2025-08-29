import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro') as { id: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verificar autenticación
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token de autorización requerido' })
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token inválido' })
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
    
    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'certificate_usage'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          count: 0,
          message: 'Tabla certificate_usage no existe aún',
          tableExists: false
        })
      };
    }

    // Contar certificados del usuario
    const result = await client.query(
      'SELECT COUNT(*) as count FROM certificate_usage WHERE user_id = $1',
      [decoded.id]
    );

    // Obtener algunos certificados de ejemplo
    const samplesResult = await client.query(
      'SELECT folio, placas, created_at FROM certificate_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [decoded.id]
    );

    // Información general de la tabla
    const totalResult = await client.query('SELECT COUNT(*) as total FROM certificate_usage');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId: decoded.id,
        userEmail: decoded.email,
        count: parseInt(result.rows[0].count),
        totalCertificates: parseInt(totalResult.rows[0].total),
        tableExists: true,
        recentCertificates: samplesResult.rows,
        message: 'Información de certificados obtenida exitosamente'
      })
    };

  } catch (error) {
    console.error('Error consultando certificados:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
