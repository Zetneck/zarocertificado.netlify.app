import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Función de prueba funcionando',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path
    })
  };
};
