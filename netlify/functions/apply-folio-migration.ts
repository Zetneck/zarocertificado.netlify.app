import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  // Bloquear en producción por seguridad
  if (process.env.NODE_ENV === 'production') {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  }

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
    console.log('📋 Aplicando migración de folios...');

    // Ejecutar la migración completa
    await client.query(`
      -- Crear tabla para manejar la secuencia de folios de certificados
      CREATE TABLE IF NOT EXISTS certificate_sequence (
          id SERIAL PRIMARY KEY,
          next_folio INTEGER NOT NULL DEFAULT 10100,
          updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Insertar el valor inicial si no existe
      INSERT INTO certificate_sequence (next_folio) 
      SELECT 10100 
      WHERE NOT EXISTS (SELECT 1 FROM certificate_sequence);
    `);

    // Verificar si la tabla certificates existe antes de añadir columna
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'certificates'
      );
    `);

    if (tableExists.rows[0].exists) {
      await client.query(`
        -- Agregar columna folio a la tabla de certificados si no existe
        ALTER TABLE certificates 
        ADD COLUMN IF NOT EXISTS folio INTEGER UNIQUE;

        -- Crear índice para mejor rendimiento
        CREATE INDEX IF NOT EXISTS idx_certificates_folio ON certificates(folio);
      `);
      console.log('✅ Columna folio añadida a tabla certificates');
    } else {
      console.log('⚠️ Tabla certificates no existe, omitiendo ALTER TABLE');
    }

    // Crear la función para obtener siguiente folio
    await client.query(`
      -- Función para obtener el siguiente folio de forma atómica
      CREATE OR REPLACE FUNCTION get_next_certificate_folio() 
      RETURNS INTEGER AS $$
      DECLARE
          next_folio_num INTEGER;
      BEGIN
          -- Obtener y actualizar el siguiente folio de forma atómica
          UPDATE certificate_sequence 
          SET next_folio = next_folio + 1,
              updated_at = NOW()
          RETURNING next_folio - 1 INTO next_folio_num;
          
          -- Si no hay registros, inicializar
          IF next_folio_num IS NULL THEN
              INSERT INTO certificate_sequence (next_folio) VALUES (10101);
              next_folio_num := 10100;
          END IF;
          
          RETURN next_folio_num;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verificar que todo funciona
    const testResult = await client.query('SELECT next_folio FROM certificate_sequence LIMIT 1');
    const testFunction = await client.query('SELECT get_next_certificate_folio() AS test_folio');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Migración aplicada exitosamente',
        currentNextFolio: testResult.rows[0]?.next_folio,
        testFunctionResult: testFunction.rows[0]?.test_folio,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  } finally {
    await client.end();
  }
};
