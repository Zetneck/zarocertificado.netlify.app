import { Client } from 'pg';

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, enable } = JSON.parse(event.body || '{}');
    
    if (!email || typeof enable !== 'boolean') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Email y enable (boolean) son requeridos' }),
      };
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    try {
      const result = await client.query(
        `UPDATE users SET two_factor_enabled = $1 WHERE email = $2 RETURNING email, two_factor_enabled`,
        [enable, email]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Usuario no encontrado' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: `2FA ${enable ? 'habilitado' : 'deshabilitado'} para ${email}`,
          user: result.rows[0]
        }),
      };

    } finally {
      await client.end();
    }

  } catch (error: unknown) {
    console.error('Error en set-2fa-user:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Error interno del servidor'
      }),
    };
  }
};
