import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyAdmin = (token: string): { id: string; email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro') as { id: string; email: string; role: string };
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET' && event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Solo se permiten métodos GET, POST y PATCH' })
    };
  }

  let client: Client | undefined;

  try {
    // Conexión a Neon
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();

    if (event.httpMethod === 'GET') {
      // Siempre listar, sin ejecutar limpieza
      console.log('🔍 Consultando usuarios eliminados (solo lectura)...');

      const deletedUsersResult = await client.query(
        "SELECT id, email, name, created_at, updated_at FROM users WHERE (email ~* '_deleted_' OR POSITION('_deleted_' IN email) > 0 OR email ILIKE '%\\_deleted\\_%' ESCAPE '\\' OR email ~* '\\+deleted_') ORDER BY updated_at DESC NULLS LAST, created_at DESC"
      );

      const deletedUsers = deletedUsersResult.rows;
      console.log(`📊 Encontrados ${deletedUsers.length} usuarios marcados como eliminados`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Información de usuarios eliminados',
          deleted_users_count: deletedUsers.length,
          deleted_users: deletedUsers.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            deleted_at: user.updated_at || user.created_at
          })),
          note: 'Para ejecutar la limpieza, realiza una petición POST con un token de administrador válido'
        })
      };
    }

  // POST: ejecutar limpieza definitiva (requiere admin)
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token requerido para limpiar usuarios' })
      };
    }
    const admin = verifyAdmin(authHeader.substring(7));
    if (!admin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo administradores pueden limpiar usuarios' })
      };
    }

    if (event.httpMethod === 'PATCH') {
      // Restaurar usuario eliminado (soft)
      const id = event.queryStringParameters?.id;
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID de usuario requerido' }) };
      }

      const userRes = await client.query('SELECT id, email FROM users WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Usuario no encontrado' }) };
      }
      const currentEmail: string = userRes.rows[0].email;

      // Detectar si realmente está marcado como eliminado
  // Soportar patrones antiguos (_deleted_123) y nuevos (+deleted_123.456 antes de @)
  const isDeleted = /_deleted_/i.test(currentEmail) || /\+deleted_[^@]+@/i.test(currentEmail);
      if (!isDeleted) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'El usuario no está marcado como eliminado' }) };
      }

      // Calcular email restaurado
      let restoredEmail = currentEmail;
      const atIdx = currentEmail.indexOf('@');
      if (atIdx > 0) {
        const local = currentEmail.slice(0, atIdx);
        const domain = currentEmail.slice(atIdx + 1);
        // Limpiar marcador en local y dominio
        const cleanedLocal = local.replace(/\+deleted_.*$/i, '');
        const cleanedDomain = domain.replace(/_deleted_[0-9.]+$/i, '');
        restoredEmail = `${cleanedLocal}@${cleanedDomain}`;
      } else {
        // Caso extremo: sin @, quitar sufijo _deleted_...
        restoredEmail = currentEmail.replace(/_deleted_[0-9.]+$/i, '');
      }

      // Validar formato básico
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(restoredEmail)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No se pudo reconstruir un email válido para restaurar' }) };
      }

      // Verificar unicidad
      const exists = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2', [restoredEmail, id]);
      if (exists.rows.length > 0) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'No se puede restaurar: el email ya está en uso' }) };
      }

      // Restaurar
      const upd = await client.query('UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name', [restoredEmail, id]);
      console.log(`♻️ Usuario restaurado id=${id}: ${currentEmail} -> ${restoredEmail}`);
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Usuario restaurado', user: upd.rows[0] }) };
    }

    console.log('🧹 Iniciando limpieza de usuarios eliminados...');

    const deletedUsersResult = await client.query(
      "SELECT id, email, name FROM users WHERE (email ~* '_deleted_' OR POSITION('_deleted_' IN email) > 0 OR email ILIKE '%\\_deleted\\_%' ESCAPE '\\' OR email ~* '\\+deleted_')"
    );

    const deletedUsers = deletedUsersResult.rows;
    console.log(`📊 Encontrados ${deletedUsers.length} usuarios marcados como eliminados`);

    if (deletedUsers.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'No hay usuarios eliminados para limpiar',
          cleaned: 0
        })
      };
    }

    let cleanedCount = 0;

    for (const user of deletedUsers) {
      console.log(`🗑️ Eliminando usuario: ${user.email}`);
      try {
        await client.query('DELETE FROM certificate_usage WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM users WHERE id = $1', [user.id]);
        cleanedCount++;
        console.log(`✅ Usuario ${user.email} eliminado permanentemente`);
      } catch (error) {
        console.error(`❌ Error eliminando usuario ${user.email}:`, error);
      }
    }

    console.log(`🎉 Limpieza completada. ${cleanedCount} usuarios eliminados permanentemente`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Limpieza completada exitosamente',
        cleaned: cleanedCount,
        details: `${cleanedCount} usuarios eliminados permanentemente de la base de datos`
      })
    };

  } catch (error) {
    console.error('❌ Error en limpieza de usuarios:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (error) {
        console.error('Error cerrando conexión:', error);
      }
    }
  }
};
