import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro') as { id: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
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
    console.log('❌ Token inválido o no se pudo decodificar');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token inválido' })
    };
  }

  console.log('🔍 Token decodificado:', {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role
  });

  let client: Client | null = null;

  try {
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Asegurar que la tabla certificate_usage existe
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS certificate_usage (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          folio VARCHAR(100) NOT NULL,
          placas VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Tabla certificate_usage verificada');
    } catch (tableError) {
      console.warn('⚠️ Error verificando tabla:', tableError);
    }
    
    const { folio, placas } = JSON.parse(event.body || '{}');

    if (!folio || !placas) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Folio y placas son requeridos' })
      };
    }

    // Verificar que el usuario exista
    console.log('🔍 Buscando usuario con ID:', decoded.id);
    const userResult = await client.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.id]
    );

    console.log('📊 Resultado de consulta usuario:', {
      rowsFound: userResult.rows.length,
      user: userResult.rows[0] || null
    });

    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado en base de datos con ID:', decoded.id);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }

    // Registrar uso del certificado
    console.log('📝 Insertando certificado:', {
      userId: decoded.id,
      folio: folio,
      placas: placas
    });
    
    await client.query(
      'INSERT INTO certificate_usage (user_id, folio, placas) VALUES ($1, $2, $3)',
      [decoded.id, folio, placas]
    );

    console.log('✅ Certificado registrado exitosamente en BD');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Certificado registrado exitosamente',
        data: {
          userId: decoded.id,
          folio: folio,
          placas: placas
        }
      })
    };

  } catch (error) {
    console.error('Error al registrar certificado:', error);
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
