import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const result: {
    ok: boolean;
    env: { hasDatabaseUrl: boolean; node: string };
    db: { connected: boolean; usersCount: number | null; hasCreditsColumn: boolean | null };
  } = {
    ok: true,
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      node: process.version,
    },
    db: {
      connected: false,
      usersCount: null as number | null,
      hasCreditsColumn: null as boolean | null,
    }
  };

  let client: Client | null = null;
  try {
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    if (!databaseUrl) {
      return { statusCode: 200, headers, body: JSON.stringify({ ...result, ok: false, message: 'DATABASE_URL no configurada' }) };
    }

    client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    result.db.connected = true;

    // Conteo de usuarios
    const count = await client.query('SELECT COUNT(*)::int AS c FROM users');
    result.db.usersCount = count.rows[0]?.c ?? 0;

    // Verificar si la columna credits existe aún
    const col = await client.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'credits'
       ) AS exists`);
    result.db.hasCreditsColumn = Boolean(col.rows[0]?.exists);

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'DB error';
    return { statusCode: 200, headers, body: JSON.stringify({ ...result, ok: false, error: message }) };
  } finally {
    if (client) await client.end();
  }
};
