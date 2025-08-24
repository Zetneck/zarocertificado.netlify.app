import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateTempPassword(length = 14): string {
  // Genera una contraseña aleatoria segura con minúsculas, mayúsculas, dígitos y símbolos seguros
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*_-+';
  const bytes = crypto.randomBytes(length);
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // Verificar admin
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token requerido' }) };
  }

  try {
    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as { id: string; email: string; role: string };
    if (decoded.role !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Solo administradores' }) };
    }
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token inválido' }) };
  }

  const { userId, customPassword } = JSON.parse(event.body || '{}');
  if (!userId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId requerido' }) };
  }

  const tempPassword = typeof customPassword === 'string' && customPassword.length >= 6
    ? customPassword
    : generateTempPassword();

  let client: Client | null = null;
  try {
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    if (!databaseUrl) throw new Error('DATABASE_URL no configurada');

    client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const userRes = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Usuario no encontrado' }) };
    }

    const hash = await bcrypt.hash(tempPassword, 10);
    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, tempPassword }) // Se devuelve solo en esta respuesta
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno';
    return { statusCode: 500, headers, body: JSON.stringify({ error: message }) };
  } finally {
    if (client) await client.end();
  }
};
