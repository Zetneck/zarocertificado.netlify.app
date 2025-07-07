import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Solo se permiten métodos GET y POST' })
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

    // Verificar si hay token de administrador
    const authHeader = event.headers.authorization;
    const hasAuthToken = authHeader?.startsWith('Bearer ');
    
    let admin: { id: string; email: string; role: string } | null = null;
    if (hasAuthToken && authHeader) {
      admin = verifyAdmin(authHeader.substring(7));
    }

    // Si no hay token o no es admin, solo mostrar información
    if (!hasAuthToken || !admin) {
      console.log('🔍 Consultando usuarios eliminados (solo lectura)...');

      // Obtener usuarios marcados como eliminados
      const deletedUsersResult = await client.query(
        'SELECT id, email, name, created_at FROM users WHERE email LIKE \'%_deleted_%\' ORDER BY created_at DESC'
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
            deleted_at: user.created_at
          })),
          note: 'Para ejecutar la limpieza, proporciona un token de administrador válido'
        })
      };
    }

    console.log('🧹 Iniciando limpieza de usuarios eliminados...');

    // Obtener usuarios marcados como eliminados
    const deletedUsersResult = await client.query(
      'SELECT id, email, name FROM users WHERE email LIKE \'%_deleted_%\''
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

    // Eliminar cada usuario y sus datos relacionados
    for (const user of deletedUsers) {
      console.log(`🗑️ Eliminando usuario: ${user.email}`);
      
      try {
        // Eliminar registros relacionados primero
        await client.query('DELETE FROM certificate_usage WHERE user_id = $1', [user.id]);
        
        // Eliminar el usuario
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
        message: `Limpieza completada exitosamente`,
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
