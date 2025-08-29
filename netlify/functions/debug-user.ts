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
    
    // Buscar usuario específico del token
    const userResult = await client.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    // Buscar todos los usuarios con un email similar
    const similarUsersResult = await client.query(
      'SELECT id, email, name, created_at FROM users WHERE email = $1',
      [decoded.email]
    );

    // Obtener algunos usuarios para comparar formato de IDs
    const sampleUsersResult = await client.query(
      'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug de usuario',
        tokenData: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        },
        userById: userResult.rows[0] || null,
        usersByEmail: similarUsersResult.rows,
        sampleUsers: sampleUsersResult.rows,
        counts: {
          userById: userResult.rows.length,
          usersByEmail: similarUsersResult.rows.length,
          totalUsers: await client.query('SELECT COUNT(*) FROM users').then(r => r.rows[0].count)
        }
      })
    };

  } catch (error) {
    console.error('Error en debug-user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
