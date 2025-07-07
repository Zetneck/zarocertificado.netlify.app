import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Usuarios de prueba para testing local
const testUsers = [
  {
    id: '1',
    email: 'admin@zaro.com',
    password: 'admin123',
    name: 'Administrador Zaro',
    role: 'admin',
    credits: 100,
    twoFactorEnabled: true, // Usuario con 2FA habilitado para testing
    phone: '+52 555 123 4567',
    department: 'Administración',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: '2',
    email: 'usuario@fumigacion.mx',
    password: 'demo123',
    name: 'Usuario Demo',
    role: 'user',
    credits: 50,
    twoFactorEnabled: false, // Usuario sin 2FA
    phone: '+52 555 987 6543',
    department: 'Operaciones',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  }
];

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

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email y contraseña son requeridos' })
      };
    }

    // Buscar usuario en la lista de prueba
    const user = testUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciales incorrectas' })
      };
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );

    // Preparar datos del usuario para el frontend
    const { password: _, ...userData } = user;

    console.log(`🔍 Testing Login para ${user.email}: 2FA = ${userData.twoFactorEnabled}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: userData,
        token,
        message: 'Login exitoso (modo testing)'
      })
    };

  } catch (error) {
    console.error('Error en login testing:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
