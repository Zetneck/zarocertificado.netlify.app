import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyToken = (token: string): { userId: string; id: string; email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro') as { userId?: string; id?: string; email: string; role: string };
    // Asegurar compatibilidad entre id y userId
    const resolvedId = decoded.id || decoded.userId;
    const resolvedUserId = decoded.userId || decoded.id;
    
    if (!resolvedId || !resolvedUserId) {
      return null;
    }
    
    return {
      ...decoded,
      id: resolvedId,
      userId: resolvedUserId
    };
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

    if (event.httpMethod === 'GET') {
      // Obtener perfil del usuario actual
      const result = await client.query(
        'SELECT id, email, name, role, phone, department, credits, two_factor_enabled, settings, created_at, last_login FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        console.log('❌ Usuario no encontrado en base de datos para ID:', decoded.id);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Usuario no encontrado' })
        };
      }

      const user = result.rows[0];
      
      // Mapear campos de BD (snake_case) a frontend (camelCase)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
        credits: user.credits,
        twoFactorEnabled: user.two_factor_enabled, // Mapeo correcto
        settings: user.settings,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: userResponse })
      };

    } else if (event.httpMethod === 'PUT') {
      // Actualizar perfil del usuario
      const updateData = JSON.parse(event.body || '{}');
      
      const allowedFields = ['name', 'phone', 'department', 'settings'];
      const updates: string[] = [];
      const values: (string | number | object)[] = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          if (key === 'settings') {
            // Para JSONB, necesitamos manejar la actualización especialmente
            updates.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(updateData[key]));
          } else {
            updates.push(`${key} = $${paramCount}`);
            values.push(updateData[key]);
          }
          paramCount++;
        }
      });

      if (updates.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No hay campos válidos para actualizar' })
        };
      }

      updates.push(`updated_at = NOW()`);
      values.push(decoded.id);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role, phone, department, credits, two_factor_enabled, settings, created_at, last_login`;
      
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Usuario no encontrado' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: result.rows[0],
          message: 'Perfil actualizado correctamente'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };

  } catch (error) {
    console.error('Error en user management:', error);
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
