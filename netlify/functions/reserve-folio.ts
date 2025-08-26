import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
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

    // Usar la función de PostgreSQL para obtener el siguiente folio de forma atómica
    const result = await client.query('SELECT get_next_certificate_folio() AS folio');
    
    if (result.rows.length > 0) {
      const folio = result.rows[0].folio;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          folio: folio,
          message: 'Folio reservado exitosamente'
        })
      };
    } else {
      throw new Error('No se pudo obtener el folio');
    }

  } catch (error) {
    console.error('❌ Error reservando folio:', error);
    
    // Si hay error con la función, intentar el método manual
    try {
      // Crear la tabla si no existe
      await client.query(`
        CREATE TABLE IF NOT EXISTS certificate_sequence (
          id SERIAL PRIMARY KEY,
          next_folio INTEGER NOT NULL DEFAULT 10100,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Insertar registro inicial si no existe
      await client.query(`
        INSERT INTO certificate_sequence (next_folio) 
        SELECT 10100 
        WHERE NOT EXISTS (SELECT 1 FROM certificate_sequence);
      `);

      // Crear la función si no existe
      await client.query(`
        CREATE OR REPLACE FUNCTION get_next_certificate_folio() 
        RETURNS INTEGER AS $$
        DECLARE
            next_folio_num INTEGER;
        BEGIN
            UPDATE certificate_sequence 
            SET next_folio = next_folio + 1,
                updated_at = NOW()
            RETURNING next_folio - 1 INTO next_folio_num;
            
            IF next_folio_num IS NULL THEN
                INSERT INTO certificate_sequence (next_folio) VALUES (10101);
                next_folio_num := 10100;
            END IF;
            
            RETURN next_folio_num;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Intentar nuevamente
      const retryResult = await client.query('SELECT get_next_certificate_folio() AS folio');
      const folio = retryResult.rows[0].folio;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          folio: folio,
          message: 'Folio reservado exitosamente (después de crear función)'
        })
      };

    } catch (retryError) {
      console.error('❌ Error en retry:', retryError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          folio: 10100 // Fallback
        })
      };
    }
  } finally {
    await client.end();
  }
};
