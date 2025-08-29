import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const verifyToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'tu-jwt-secret-muy-seguro') as { id: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verificar autenticación y que sea admin
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token de autorización requerido' })
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded || decoded.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Acceso denegado - solo administradores pueden reiniciar el sistema' })
    };
  }

  let client: Client | null = null;

  try {
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();

    console.log('🔄 Iniciando reinicio del sistema...');
    console.log('👤 Usuario que ejecuta:', decoded.email);

    // 1. Contar registros antes de limpiar (para el log)
    const countBefore = await client.query('SELECT COUNT(*) FROM certificate_usage');
    const certificatesBefore = parseInt(countBefore.rows[0].count);

    // Obtener el folio actual antes de reiniciar
    const currentFolioResult = await client.query('SELECT next_folio FROM certificate_sequence LIMIT 1');
    const currentFolio = currentFolioResult.rows.length > 0 ? currentFolioResult.rows[0].next_folio : 'N/A';

    console.log(`📊 Estado antes del reinicio:`);
    console.log(`   - Certificados: ${certificatesBefore}`);
    console.log(`   - Próximo folio: ${currentFolio}`);

    // 2. Limpiar todos los registros de certificados
    await client.query('DELETE FROM certificate_usage');
    console.log('🗑️ Todos los registros de certificados eliminados');

    // 3. Reiniciar la secuencia de folios a 10100
    try {
      await client.query('UPDATE certificate_sequence SET next_folio = 10100');
      console.log('🔢 Secuencia de folios reiniciada a 10100');
    } catch (folioError) {
      console.log('⚠️ Error reiniciando folios:', folioError.message);
      // Intentar crear la tabla si no existe
      try {
        await client.query(`
          INSERT INTO certificate_sequence (next_folio) 
          VALUES (10100) 
          ON CONFLICT DO NOTHING
        `);
        console.log('🔢 Secuencia de folios creada con valor inicial 10100');
      } catch (createError) {
        console.log('❌ No se pudo reiniciar la secuencia de folios:', createError.message);
      }
    }

    // 4. Verificar que se eliminaron correctamente
    const countAfter = await client.query('SELECT COUNT(*) FROM certificate_usage');
    const certificatesAfter = parseInt(countAfter.rows[0].count);

    // Verificar el folio después del reinicio
    const newFolioResult = await client.query('SELECT next_folio FROM certificate_sequence LIMIT 1');
    const newFolio = newFolioResult.rows.length > 0 ? newFolioResult.rows[0].next_folio : 'Error';

    // 5. Reiniciar la secuencia de ID si existe
    try {
      await client.query('ALTER SEQUENCE certificate_usage_id_seq RESTART WITH 1');
      console.log('🔢 Secuencia de IDs reiniciada');
    } catch {
      console.log('⚠️ No se pudo reiniciar secuencia de IDs (normal si usa UUID)');
    }

    console.log('✅ Reinicio completado exitosamente');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Sistema reiniciado exitosamente',
        data: {
          certificatesDeleted: certificatesBefore,
          currentCertificates: certificatesAfter,
          folioResetFrom: currentFolio,
          folioResetTo: newFolio,
          resetBy: decoded.email,
          resetAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Error al reiniciar sistema:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error al reiniciar el sistema',
        details: error.message
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
