import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();

    // Obtener el siguiente folio disponible (sin consumirlo)
    const result = await client.query('SELECT next_folio FROM certificate_sequence LIMIT 1');
    
    let nextFolio = 10100; // Valor por defecto
    if (result.rows.length > 0) {
      nextFolio = result.rows[0].next_folio;
    } else {
      // Si no existe la tabla o registro, inicializarla
      await client.query(`
        CREATE TABLE IF NOT EXISTS certificate_sequence (
          id SERIAL PRIMARY KEY,
          next_folio INTEGER NOT NULL DEFAULT 10100,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await client.query(`
        INSERT INTO certificate_sequence (next_folio) 
        SELECT 10100 
        WHERE NOT EXISTS (SELECT 1 FROM certificate_sequence);
      `);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        nextFolio: nextFolio,
        message: 'Siguiente folio obtenido exitosamente'
      })
    };

  } catch (error) {
    console.error('❌ Error obteniendo folio:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        nextFolio: 10100 // Fallback
      })
    };
  } finally {
    await client.end();
  }
};
