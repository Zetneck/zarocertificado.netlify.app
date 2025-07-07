import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('=== DEBUG QR TOKEN ===');
    console.log('Method:', event.httpMethod);
    console.log('Headers:', event.headers);
    console.log('Body:', event.body);

    let token: string | null = null;
    let tokenSource = '';

    // POST request
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      token = body.tempToken;
      tokenSource = 'POST body tempToken';
      console.log('POST body:', body);
    }
    
    // GET request
    if (event.httpMethod === 'GET') {
      const authHeader = event.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        tokenSource = 'GET Authorization header';
      }
      console.log('Authorization header:', authHeader);
    }

    console.log('Token source:', tokenSource);
    console.log('Token exists:', !!token);
    console.log('Token preview:', token?.substring(0, 30) + '...');

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No token found',
          debug: {
            method: event.httpMethod,
            tokenSource,
            hasAuthHeader: !!event.headers.authorization,
            bodyKeys: event.body ? Object.keys(JSON.parse(event.body)) : []
          }
        }),
      };
    }

    // Intentar decodificar el token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          debug: {
            tokenSource,
            decoded,
            jwtSecret: JWT_SECRET.substring(0, 10) + '...'
          }
        }),
      };
    } catch (error) {
      console.error('Token decode error:', error);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Token decode failed',
          debug: {
            tokenSource,
            tokenPreview: token.substring(0, 30) + '...',
            error: error instanceof Error ? error.message : 'Unknown error',
            jwtSecret: JWT_SECRET.substring(0, 10) + '...'
          }
        }),
      };
    }

  } catch (error) {
    console.error('Debug error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Debug function error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
