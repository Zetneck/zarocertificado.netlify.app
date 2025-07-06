import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export const handler: Handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // 1. Verificar variables de entorno
    const hasDatabase = !!process.env.DATABASE_URL;
    const hasJWT = !!process.env.JWT_SECRET;
    
    if (!hasDatabase) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'DATABASE_URL no está configurada en Netlify',
          step: 'environment_check'
        })
      };
    }

    if (!hasJWT) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'JWT_SECRET no está configurada en Netlify',
          step: 'environment_check'
        })
      };
    }

    // 2. Intentar conexión a la base de datos
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // 3. Verificar que existan usuarios
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(usersResult.rows[0].count);

    if (userCount === 0) {
      await client.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No hay usuarios en la base de datos. Necesitas ejecutar el SQL para crear usuarios.',
          step: 'users_check',
          userCount: 0
        })
      };
    }

    // 4. Verificar usuario admin específicamente
    const adminResult = await client.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      ['admin@zaro.com']
    );

    if (adminResult.rows.length === 0) {
      await client.end();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Usuario admin@zaro.com no existe en la base de datos',
          step: 'admin_check',
          userCount
        })
      };
    }

    // 5. Verificar que la contraseña funcione
    const admin = adminResult.rows[0];
    const passwordMatch = await bcrypt.compare('admin123', admin.password_hash);

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Diagnóstico completado exitosamente',
        checks: {
          database_url: hasDatabase,
          jwt_secret: hasJWT,
          user_count: userCount,
          admin_exists: true,
          password_valid: passwordMatch
        },
        admin_user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      })
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        step: 'connection_error',
        details: errorDetails
      })
    };
  }
};
