import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro';

interface DecodedToken {
  id: string;  // Cambiado de userId a id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  try {
    console.log('📍 Función verify-2fa iniciada');
    console.log('📍 Body recibido:', event.body);

    const { code, tempToken } = JSON.parse(event.body || '{}');
    console.log('📍 Code:', code, 'TempToken existe:', !!tempToken);

    if (!code || !tempToken) {
      console.log('❌ Faltan parámetros');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Código y token temporal requeridos' }),
      };
    }

    // Verificar el token temporal
    let decodedToken: DecodedToken;
    try {
      console.log('📍 Verificando token...');
      decodedToken = jwt.verify(tempToken, JWT_SECRET) as DecodedToken;
      console.log('📍 Token decodificado:', { id: decodedToken.id, email: decodedToken.email });
    } catch (error) {
      console.log('❌ Token inválido:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token temporal inválido' }),
      };
    }

    // Verificar código 2FA - versión simplificada
    console.log('📍 Verificando código 2FA...');
    const validCodes = ['123456', '000000', '111111'];
    const isValidCode = validCodes.includes(code);
    
    console.log('📍 Código válido:', isValidCode);

    if (!isValidCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Código incorrecto',
          message: 'Código de verificación inválido. Códigos válidos: 123456, 000000, 111111'
        }),
      };
    }

    // Generar token de autenticación final (simplificado)
    console.log('📍 Generando token final...');
    const authToken = jwt.sign(
      { 
        userId: decodedToken.id, 
        email: decodedToken.email,
        role: decodedToken.role,
        twoFactorVerified: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Verificación exitosa');

    // Usuario simplificado para respuesta
    const userResponse = {
      id: decodedToken.id,
      email: decodedToken.email,
      name: 'Usuario Autenticado', // Simplificado
      role: decodedToken.role,
      phone: null,
      department: null,
      twoFactorEnabled: true,
      settings: {},
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verificación 2FA exitosa',
        token: authToken,
        user: userResponse,
      }),
    };

  } catch (error) {
    console.error('❌ Error en verify-2fa:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Error en procesamiento',
        message: (error as Error).message
      }),
    };
  }
};
