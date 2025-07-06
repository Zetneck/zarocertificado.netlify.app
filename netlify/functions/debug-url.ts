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

  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'DATABASE_URL no definida' })
      };
    }

    // Analizar la URL
    const url = new URL(databaseUrl);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 'default',
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams),
        username: url.username ? '***' : 'none',
        password: url.password ? '***' : 'none',
        fullUrl: databaseUrl.replace(/:[^:@]*@/, ':***@').replace(/\/\/[^:]*:/, '//***:')
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al analizar DATABASE_URL',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  }
};
