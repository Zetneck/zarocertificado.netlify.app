import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logAccess, getClientIP } from './utils/accessLogger';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
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

  let client: Client | null = null;

  try {
    // Conexión a Neon - removemos channel_binding que puede causar problemas
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email y contraseña son requeridos' })
      };
    }

    // Buscar usuario en la base de datos
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Intentar registrar acceso fallido (sin user id)
      try {
        await client.query(`
          INSERT INTO access_logs (
            user_id, 
            ip_address, 
            user_agent, 
            device_type, 
            browser, 
            status, 
            two_factor_used
          ) VALUES (NULL, $1, $2, $3, $4, $5, $6)
        `, [
          getClientIP(event),
          event.headers['user-agent'] || 'Unknown',
          'Unknown',
          'Unknown',
          'failed',
          false
        ]);
      } catch (logError) {
        console.error('Error logging failed access:', logError);
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciales incorrectas' })
      };
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      // Registrar acceso fallido
      try {
        await logAccess(client, {
          userId: user.id,
          ipAddress: getClientIP(event),
          userAgent: event.headers['user-agent'] || 'Unknown',
          status: 'failed',
          twoFactorUsed: false
        });
        console.log('✅ Acceso fallido registrado para usuario:', user.id);
      } catch (logError) {
        console.error('❌ Error registrando acceso fallido:', logError);
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciales incorrectas' })
      };
    }

    // LÓGICA DE 2FA OBLIGATORIO
    const hasSecret = user.two_factor_secret && user.two_factor_secret.length > 0;
    const is2FAEnabled = user.two_factor_enabled === true;

    // Si el usuario NO tiene secret configurado (usuario nuevo)
    if (!hasSecret) {
      // Registrar acceso exitoso - usuario sin 2FA
      try {
        await logAccess(client, {
          userId: user.id,
          ipAddress: getClientIP(event),
          userAgent: event.headers['user-agent'] || 'Unknown',
          status: 'success',
          twoFactorUsed: false
        });
        console.log('✅ Acceso exitoso registrado para usuario sin 2FA:', user.id);
      } catch (logError) {
        console.error('❌ Error registrando acceso exitoso:', logError);
      }
      
      // Generar token temporal para acceso a configuración
      const tempToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.role,
          needsSetup2FA: true
        },
        process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro',
        { expiresIn: '24h' } // Token temporal de 24 horas
      );

      // Preparar datos del usuario para setup
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, two_factor_secret, two_factor_enabled, created_at, last_login, updated_at, ...baseUserData } = user;
      
      const userData = {
        ...baseUserData,
        twoFactorEnabled: false,
        needsSetup2FA: true,
        createdAt: created_at,
        lastLogin: last_login,
        updatedAt: updated_at
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: userData,
          tempToken: tempToken,
          requiresSetup2FA: true,
          message: 'Login exitoso. Debes configurar 2FA para continuar.'
        })
      };
    }

    // Si tiene secret pero no está habilitado, forzar habilitación
    if (hasSecret && !is2FAEnabled) {
      await client.query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [user.id]
      );
    }

    // Si ya tiene 2FA configurado, requerir verificación
    if (hasSecret && (is2FAEnabled || !is2FAEnabled)) {
      // Generar token temporal para verificación 2FA
      const tempToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.role,
          requiresTwoFactor: true
        },
        process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro',
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          requiresTwoFactor: true,
          tempToken: tempToken,
          message: 'Ingresa el código de tu aplicación autenticadora'
        })
      };
    }

    // Actualizar último login solo si llega aquí (caso de emergencia)
    await client.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Este código solo debería ejecutarse en casos de emergencia
    // La mayoría de usuarios deberían pasar por la lógica de 2FA arriba
    
    // Generar JWT de emergencia
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        emergency: true
      },
      process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro',
      { expiresIn: '24h' }
    );

    // Preparar datos del usuario
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, two_factor_secret, two_factor_enabled, created_at, last_login, updated_at, ...baseUserData } = user;
    
    // Convertir a camelCase para el frontend
    const userData = {
      ...baseUserData,
      twoFactorEnabled: two_factor_enabled || false,
      createdAt: created_at,
      lastLogin: last_login,
      updatedAt: updated_at
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: userData,
        token,
        message: 'Login de emergencia - Configura 2FA inmediatamente'
      })
    };

  } catch (error) {
    console.error('Error en login:', error);
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
