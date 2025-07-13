import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

interface NetlifyEvent {
  httpMethod: string;
  headers: { [key: string]: string | undefined };
  body: string | null;
}

export const handler = async (event: NetlifyEvent) => {
  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verificar autenticación
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Token de autenticación requerido' }),
      };
    }

    // Verificar el token JWT
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    const { enable } = JSON.parse(event.body || '{}');
    
    if (typeof enable !== 'boolean') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Parámetro "enable" requerido (boolean)' }),
      };
    }

    // Conectar a la base de datos
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    const client = new Client({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    try {
      // Actualizar el estado de 2FA del usuario
      const updateQuery = `
        UPDATE users 
        SET two_factor_enabled = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, name, role, two_factor_enabled, credits, created_at, last_login
      `;
      
      const result = await client.query(updateQuery, [enable, decoded.id]);
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Usuario no encontrado' }),
        };
      }

      const user = result.rows[0];

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: enable 
            ? 'Autenticación de dos factores habilitada exitosamente'
            : 'Autenticación de dos factores deshabilitada exitosamente',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            twoFactorEnabled: user.two_factor_enabled,
            credits: user.credits,
            createdAt: user.created_at,
            lastLogin: user.last_login
          }
        }),
      };

    } finally {
      await client.end();
    }

  } catch (error: unknown) {
    console.error('Error in toggle-2fa:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Error interno del servidor al cambiar configuración 2FA'
      }),
    };
  }
};
