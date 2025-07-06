import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export const handler: Handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  let client: Client | null = null;

  try {
    // 1. Conectar a la base de datos
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();

    // 2. Buscar usuario admin
    const result = await client.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      ['admin@zaro.com']
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Usuario admin@zaro.com no encontrado',
          step: 'user_lookup'
        })
      };
    }

    const user = result.rows[0];

    // 3. Probar contraseña
    const passwordMatch = await bcrypt.compare('admin123', user.password_hash);

    // 4. Crear hash nuevo para comparar
    const newHash = await bcrypt.hash('admin123', 10);
    const newHashMatch = await bcrypt.compare('admin123', newHash);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user_found: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        password_tests: {
          stored_hash_length: user.password_hash.length,
          stored_hash_starts_with: user.password_hash.substring(0, 10),
          password_match_current: passwordMatch,
          new_hash_works: newHashMatch
        },
        expected_hash: '$2a$10$rZaF7YGVcKzGFJq8Q2RHO.WX3zQvQK1qYmQ8kH6LXpJ4vB3nR2T8m',
        stored_hash_matches_expected: user.password_hash === '$2a$10$rZaF7YGVcKzGFJq8Q2RHO.WX3zQvQK1qYmQ8kH6LXpJ4vB3nR2T8m'
      })
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        step: 'connection_error'
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
