import { Handler } from '@netlify/functions';

interface DebugResponse {
  timestamp: string;
  environment_check: {
    database_url_exists: boolean;
    jwt_secret_exists: boolean;
    database_url_length: number;
    jwt_secret_length: number;
  };
  expected_values: {
    jwt_secret_should_be: number;
    database_url_should_contain: string[];
  };
  error?: string;
  solution?: string;
}

export const handler: Handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Verificar variables de entorno básicas
    const hasDatabase = !!process.env.DATABASE_URL;
    const hasJWT = !!process.env.JWT_SECRET;
    
    const response: DebugResponse = {
      timestamp: new Date().toISOString(),
      environment_check: {
        database_url_exists: hasDatabase,
        jwt_secret_exists: hasJWT,
        database_url_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
        jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
      },
      expected_values: {
        jwt_secret_should_be: 128,
        database_url_should_contain: ['postgresql://', 'neon.tech', 'sslmode=require']
      }
    };

    if (!hasDatabase) {
      response.error = 'DATABASE_URL missing';
      response.solution = 'Add DATABASE_URL variable in Netlify with your Neon connection string';
    }

    if (!hasJWT) {
      response.error = 'JWT_SECRET missing';
      response.solution = 'Add JWT_SECRET variable in Netlify';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};
