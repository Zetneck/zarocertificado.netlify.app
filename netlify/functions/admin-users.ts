import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyAdmin = (token: string): { id: string; email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this') as { id: string; email: string; role: string };
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let client: Client | undefined;

  try {
    // Conexión a Neon - removemos channel_binding que puede causar problemas
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();

    // Verificar que sea admin
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token requerido' })
      };
    }

    const admin = verifyAdmin(authHeader.substring(7));
    if (!admin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo administradores pueden gestionar usuarios' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Listar todos los usuarios
      const page = parseInt(event.queryStringParameters?.page || '1');
      const limit = parseInt(event.queryStringParameters?.limit || '20');
      const offset = (page - 1) * limit;

      const result = await client.query(
        `SELECT id, email, name, role, phone, department, credits, 
                two_factor_enabled, created_at, last_login,
                (SELECT COUNT(*) FROM certificate_usage WHERE user_id = users.id) as certificates_count
         FROM users 
         WHERE email NOT LIKE '%_deleted_%'
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await client.query('SELECT COUNT(*) FROM users WHERE email NOT LIKE \'%_deleted_%\'');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          users: result.rows,
          pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / limit)
          }
        })
      };

    } else if (event.httpMethod === 'POST') {
      // Crear nuevo usuario
      const { email, name, password, role, credits, phone, department } = JSON.parse(event.body || '{}');

      if (!email || !name || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email, nombre y contraseña son requeridos' })
        };
      }

      // Verificar email único
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Email ya existe' })
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO users (email, name, password_hash, role, credits, phone, department)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, role, credits, phone, department, created_at`,
        [
          email.toLowerCase(),
          name,
          passwordHash,
          role || 'user',
          credits || 10,
          phone || null,
          department || null
        ]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          user: result.rows[0],
          message: 'Usuario creado exitosamente'
        })
      };

    } else if (event.httpMethod === 'PUT') {
      // Actualizar usuario
      const userId = event.queryStringParameters?.id;
      const updateData = JSON.parse(event.body || '{}');

      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID de usuario requerido' })
        };
      }

      const allowedFields = ['name', 'role', 'credits', 'phone', 'department', 'two_factor_enabled'];
      const updates: string[] = [];
      const values: (string | number | boolean)[] = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
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

      values.push(userId);
      const result = await client.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() 
         WHERE id = $${paramCount} 
         RETURNING id, email, name, role, credits, phone, department`,
        values
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: result.rows[0],
          message: 'Usuario actualizado exitosamente'
        })
      };

    } else if (event.httpMethod === 'DELETE') {
      // Eliminar usuario
      const userId = event.queryStringParameters?.id;
      const permanent = event.queryStringParameters?.permanent === 'true';

      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID de usuario requerido' })
        };
      }

      if (permanent) {
        // Eliminación permanente - eliminar registros relacionados primero
        await client.query('DELETE FROM certificate_usage WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Usuario eliminado permanentemente' })
        };
      } else {
        // Soft delete - marcar email como eliminado
        await client.query(
          'UPDATE users SET email = CONCAT(email, \'_deleted_\', extract(epoch from now())), updated_at = NOW() WHERE id = $1',
          [userId]
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Usuario eliminado exitosamente' })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };

  } catch (error) {
    console.error('Error en admin-users:', error);
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
