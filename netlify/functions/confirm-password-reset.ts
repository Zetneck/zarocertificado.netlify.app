import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let client: Client | undefined;
  try {
    const { token, password } = JSON.parse(event.body || '{}') as { token?: string; password?: string };
    if (!token || !password || password.length < 6) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token y contraseña (>=6) son requeridos' }) };
    }

    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tRes = await client.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (tRes.rows.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token inválido o expirado' }) };
    }

    const row = tRes.rows[0];
    if (row.used_at) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token ya utilizado' }) };
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token expirado' }) };
    }

    const hash = await bcrypt.hash(password, 10);
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, row.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [row.id]);
    await client.query('COMMIT');

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }) };
  } catch (e) {
    console.error('confirm-password-reset error', e);
    try {
      if (client) await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('rollback error', rollbackErr);
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) };
  } finally {
    if (client) await client.end();
  }
};
