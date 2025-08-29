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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Solo se permite método POST' })
    };
  }

  // Solo en desarrollo o con token de admin
  const isLocal = process.env.NETLIFY !== 'true';
  if (!isLocal) {
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token de administrador requerido en producción' })
      };
    }

    const admin = verifyAdmin(authHeader.substring(7));
    if (!admin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Solo administradores pueden ejecutar esta función' })
      };
    }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', ''),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('📋 Asegurando que existe la tabla certificate_usage...');

    // Crear tabla certificate_usage si no existe
    await client.query(`
      -- Crear extensión UUID si no existe
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Tabla para tracking de certificados generados
      CREATE TABLE IF NOT EXISTS certificate_usage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        folio VARCHAR(100) NOT NULL,
        placas VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Crear índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_certificate_usage_user_id ON certificate_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_certificate_usage_folio ON certificate_usage(folio);
      CREATE INDEX IF NOT EXISTS idx_certificate_usage_created_at ON certificate_usage(created_at);
    `);

    // Verificar que la tabla funciona
    const testQuery = await client.query('SELECT COUNT(*) FROM certificate_usage');
    const currentCount = testQuery.rows[0].count;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Tabla certificate_usage asegurada exitosamente',
        currentCertificatesCount: currentCount,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error asegurando tabla certificate_usage:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  } finally {
    await client.end();
  }
};
