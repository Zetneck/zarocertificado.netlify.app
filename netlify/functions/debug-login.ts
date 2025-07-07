import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('=== DEBUG LOGIN PROCESS ===');
    console.log('Method:', event.httpMethod);
    console.log('Body:', event.body);

    const { email, password } = JSON.parse(event.body || '{}');
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email y contraseña requeridos' })
      };
    }

    console.log('Login attempt for:', email);

    // Conexión a base de datos
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Buscar usuario
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    console.log('User query result:', {
      found: result.rows.length > 0,
      email: email
    });

    if (result.rows.length === 0) {
      await client.end();
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciales incorrectas' })
      };
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    console.log('Password validation:', { valid: validPassword });

    if (!validPassword) {
      await client.end();
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciales incorrectas' })
      };
    }

    // ANÁLISIS DE 2FA
    const hasSecret = user.two_factor_secret && user.two_factor_secret.length > 0;
    const is2FAEnabled = user.two_factor_enabled === true;

    console.log('2FA Analysis:', {
      hasSecret,
      is2FAEnabled,
      secretLength: user.two_factor_secret?.length || 0,
      userId: user.id
    });

    // Si NO tiene secret (usuario nuevo)
    if (!hasSecret) {
      console.log('New user - generating tempToken for 2FA setup');
      
      const tempToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.role,
          needsSetup2FA: true
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      console.log('Generated tempToken:', {
        tokenPreview: tempToken.substring(0, 30) + '...',
        payload: { id: user.id, email: user.email, role: user.role, needsSetup2FA: true }
      });

      await client.end();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          requiresSetup2FA: true,
          tempToken: tempToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          message: 'Debes configurar 2FA para continuar.'
        })
      };
    }

    // Si ya tiene 2FA configurado
    console.log('Existing user with 2FA - generating tempToken for verification');
    
    const tempToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        requiresTwoFactor: true
      },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    console.log('Generated verification tempToken:', {
      tokenPreview: tempToken.substring(0, 30) + '...',
      payload: { id: user.id, email: user.email, role: user.role, requiresTwoFactor: true }
    });

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        requiresTwoFactor: true,
        tempToken: tempToken,
        message: 'Ingresa el código de tu aplicación autenticadora'
      })
    };

  } catch (error) {
    console.error('Debug login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
