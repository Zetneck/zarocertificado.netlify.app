import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this') as { id: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
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
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    const { folio, placas } = JSON.parse(event.body || '{}');

    if (!folio || !placas) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Folio y placas son requeridos' })
      };
    }

    // Verificar que el usuario tenga créditos
    const userResult = await client.query(
      'SELECT credits FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }

    const user = userResult.rows[0];
    if (user.credits <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Créditos insuficientes' })
      };
    }

    // Registrar uso del certificado
    await client.query(
      'INSERT INTO certificate_usage (user_id, folio, placas) VALUES ($1, $2, $3)',
      [decoded.id, folio, placas]
    );

    // Descontar crédito
    await client.query(
      'UPDATE users SET credits = credits - 1 WHERE id = $1',
      [decoded.id]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Certificado registrado exitosamente',
        creditsRemaining: user.credits - 1
      })
    };

  } catch (error) {
    console.error('Error al registrar certificado:', error);
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
