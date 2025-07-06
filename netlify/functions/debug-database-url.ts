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
    
    // Ocultar información sensible pero mostrar estructura
    const sanitizedUrl = databaseUrl ? 
      databaseUrl.replace(/:[^:@]*@/, ':***@').replace(/\/\/[^:]*:/, '//***:') : 
      'No definida';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        databaseUrlExists: !!databaseUrl,
        databaseUrlLength: databaseUrl?.length || 0,
        databaseUrlSanitized: sanitizedUrl,
        databaseUrlPrefix: databaseUrl?.substring(0, 20) || 'N/A',
        allEnvVars: Object.keys(process.env).filter(key => 
          key.includes('DATABASE') || key.includes('DB')
        )
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al verificar DATABASE_URL',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  }
};
