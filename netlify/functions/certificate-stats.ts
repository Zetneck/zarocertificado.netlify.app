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

  // Verificar autenticación y que sea admin
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
  
  if (!decoded || decoded.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Acceso denegado - se requiere rol de administrador' })
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
    
    // Contar todos los certificados
    const totalCertificates = await client.query('SELECT COUNT(*) FROM certificate_usage');
    
    // Contar por usuario
    const certificatesByUser = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        COUNT(cu.id) as certificate_count
      FROM users u
      LEFT JOIN certificate_usage cu ON u.id = cu.user_id
      GROUP BY u.id, u.email, u.name
      ORDER BY certificate_count DESC
    `);

    // Últimos certificados generados
    const recentCertificates = await client.query(`
      SELECT 
        cu.folio,
        cu.placas,
        cu.created_at,
        u.email,
        u.name
      FROM certificate_usage cu
      JOIN users u ON cu.user_id = u.id
      ORDER BY cu.created_at DESC
      LIMIT 10
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Estadísticas de certificados',
        data: {
          totalCertificates: parseInt(totalCertificates.rows[0].count),
          userStats: certificatesByUser.rows,
          recentCertificates: recentCertificates.rows
        }
      })
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
