import { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Verificar variables de entorno
    const databaseUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;

    // Mostrar primeros y últimos caracteres de DATABASE_URL para debugging
    const dbUrlPreview = databaseUrl ? 
      `${databaseUrl.substring(0, 20)}...${databaseUrl.substring(databaseUrl.length - 20)}` : 
      'NOT FOUND';

    const response = {
      timestamp: new Date().toISOString(),
      environment_check: {
        database_url_exists: !!databaseUrl,
        jwt_secret_exists: !!jwtSecret,
        database_url_length: databaseUrl ? databaseUrl.length : 0,
        jwt_secret_length: jwtSecret ? jwtSecret.length : 0,
        database_url_preview: dbUrlPreview,
        database_url_contains_postgresql: databaseUrl ? databaseUrl.includes('postgresql://') : false,
        database_url_contains_neon: databaseUrl ? databaseUrl.includes('neon.tech') : false,
        database_url_contains_ssl: databaseUrl ? databaseUrl.includes('sslmode=require') : false
      },
      next_step: 'Try manual login at the main app: https://zarocertificado.netlify.app'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};
