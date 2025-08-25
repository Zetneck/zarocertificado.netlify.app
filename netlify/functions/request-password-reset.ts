import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import crypto from 'crypto';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const isProd = process.env.NODE_ENV === 'production';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let client: Client | undefined;
  try {
    const { email } = JSON.parse(event.body || '{}') as { email?: string };

    console.log('🔧 DIAGNÓSTICO EMAIL:');
    console.log('- RESEND_KEY existe:', !!process.env.RESEND_KEY);
    console.log('- MAIL_FROM:', process.env.MAIL_FROM);
    console.log('- BASE_URL:', process.env.BASE_URL);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    // Siempre respondemos 200 para evitar enumeración de emails
    const genericOk = { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Si el correo existe, se enviaron instrucciones para restablecer la contraseña.' }) };
    if (!email) return genericOk;

    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Crear extensión y tabla de tokens si no existe
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        requested_ip TEXT,
        user_agent TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens(expires_at);
    `);

    const lowerEmail = String(email).toLowerCase().trim();
    const notDeleted = `NOT (email ~* '_deleted_' OR POSITION('_deleted_' IN email) > 0 OR email ILIKE '%\\_deleted\\_%' ESCAPE '\\' OR email ~* '\\+deleted_')`;
    const userRes = await client.query(`SELECT id, email FROM users WHERE LOWER(email) = $1 AND ${notDeleted} LIMIT 1`, [lowerEmail]);
    if (userRes.rows.length === 0) {
      return genericOk;
    }
    const userId = userRes.rows[0].id as string;

    // Invalidar tokens antiguos opcionalmente (limpieza)
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND (used_at IS NOT NULL OR expires_at < NOW())', [userId]);

    // Generar token y guardar hash
    const tokenBytes = crypto.randomBytes(32);
    const token = tokenBytes.toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const ttlMinutes = parseInt(process.env.PASSWORD_RESET_TTL_MIN || '30', 10);
    const expiresAtSql = `NOW() + INTERVAL '${Number.isFinite(ttlMinutes) ? ttlMinutes : 30} minutes'`;

    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip, user_agent)
       VALUES ($1, $2, ${expiresAtSql}, $3, $4)`,
      [userId, tokenHash, event.headers['x-forwarded-for'] || event.headers['client-ip'] || '', event.headers['user-agent'] || '']
    );

    // Construir URL para email (en dev la devolvemos para pruebas)
    const origin = event.headers.origin || process.env.BASE_URL || 'http://localhost:8888';
    const resetUrl = `${origin}/reset?token=${encodeURIComponent(token)}`;

    // Enviar correo si hay proveedor configurado (Resend)
    const resendApiKey = process.env.RESEND_KEY;
    const fromEmail = process.env.MAIL_FROM;
    if (resendApiKey && fromEmail) {
      console.log('📧 Intentando enviar email via Resend...');
      try {
        const appName = process.env.APP_NAME || 'ZARO Certificados';
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222">
            <h2>${appName} - Restablecer contraseña</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;background:#1976d2;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Restablecer contraseña</a>
            </p>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break:break-all">${resetUrl}</p>
            <hr />
            <p>Si no solicitaste este cambio, ignora este mensaje.</p>
          </div>`;
        const text = `Restablecer contraseña\n\nEnlace: ${resetUrl}\n\nSi no solicitaste este cambio, ignora este mensaje.`;

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [lowerEmail],
            subject: `${process.env.APP_NAME || 'ZARO Certificados'} - Restablecer contraseña`,
            html,
            text,
          })
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => 'unknown');
          console.warn('❌ Resend response not OK:', resp.status, errText);
        } else {
          const respData = await resp.json().catch(() => ({}));
          console.log('✅ Email enviado exitosamente:', respData.id || 'ID no disponible');
        }
      } catch (mailErr) {
        console.error('❌ Error enviando email con Resend:', mailErr);
      }
    } else {
      console.warn('⚠️ Variables de email no configuradas completamente:');
      console.warn('- resendApiKey existe:', !!resendApiKey);
      console.warn('- fromEmail:', fromEmail);
      // Sin proveedor de email: log para desarrollo
      console.log(`🔑 Reset password solicitado para ${lowerEmail}. URL (dev): ${resetUrl}`);
    }

    if (isProd) {
      return genericOk;
    } else {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Token generado (solo dev).', token, resetUrl }) };
    }
  } catch (e) {
    console.error('request-password-reset error', e);
    // Aun así, no revelamos detalles
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: 'Si el correo existe, se enviaron instrucciones para restablecer la contraseña.' }) };
  } finally {
    if (client) await client.end();
  }
};
