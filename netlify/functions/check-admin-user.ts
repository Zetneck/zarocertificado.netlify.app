import { Client } from 'pg';

export const handler = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
      // Verificar si el usuario admin@zaro.com existe
      const userCheck = await client.query(
        `SELECT email, two_factor_enabled, created_at FROM users WHERE email = 'admin@zaro.com'`
      );

      // Listar todos los usuarios para debug
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
          adminUser: userCheck.rows,
          allUsers: allUsers.rows,
          adminExists: userCheck.rows.length > 0,
          adminHas2FA: userCheck.rows.length > 0 ? userCheck.rows[0].two_factor_enabled : false
        }),
      };

    } finally {
      await client.end();
    }

  } catch (error: unknown) {
    console.error('Error verificando usuario:', error);
    
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
