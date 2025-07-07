import { Handler } from '@netlify/functions';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Función simple para verificar que el frontend puede comunicarse
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ok',
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      userAgent: event.headers['user-agent'] || 'unknown'
    })
  };
};
