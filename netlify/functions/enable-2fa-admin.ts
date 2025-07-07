import { Client } from 'pg';

export const handler = async () => {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    try {
      // Habilitar 2FA para admin
      const updateResult = await client.query(
        `UPDATE users SET two_factor_enabled = true WHERE email = 'admin@zaro.com' RETURNING email, two_factor_enabled`
      );

      // Verificar todos los usuarios
      const allUsers = await client.query(
        `SELECT email, two_factor_enabled FROM users ORDER BY email`
      );

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: '2FA habilitado para admin@zaro.com',
          updated: updateResult.rows,
          allUsers: allUsers.rows
        }),
      };

    } finally {
      await client.end();
    }

  } catch (error: unknown) {
    console.error('Error en enable-2fa-admin:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
