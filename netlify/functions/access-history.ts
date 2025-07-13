import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Función para analizar user agent como fallback
function parseUserAgentFallback(userAgent: string): string {
  if (!userAgent) return 'Dispositivo desconocido';
  
  const ua = userAgent.toLowerCase();
  
  let device = 'Desktop';
  let browser = 'Navegador desconocido';
  
  // Detectar dispositivo
  if (ua.includes('iphone')) device = 'iPhone';
  else if (ua.includes('ipad')) device = 'iPad';
  else if (ua.includes('android') && ua.includes('mobile')) device = 'Android Mobile';
  else if (ua.includes('android')) device = 'Android Tablet';
  else if (ua.includes('windows')) device = 'Windows';
  else if (ua.includes('mac')) device = 'Mac';
  else if (ua.includes('linux')) device = 'Linux';
  
  // Detectar navegador
  if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opera')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  return `${device} • ${browser}`;
}

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

  let client: Client | null = null;

  try {
    // Verificar token de autenticación
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token de autorización requerido' })
      };
    }

    const token = authHeader.substring(7);
    let decoded: { userId: string };
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    // Conectar a la base de datos
    const databaseUrl = process.env.DATABASE_URL?.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
    
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();

    // Obtener historial de accesos del usuario
    // Primero verificar si la tabla existe y tiene la estructura correcta
    try {
      // Intentar crear la tabla con la estructura completa
      await client.query(`
        CREATE TABLE IF NOT EXISTS access_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          login_time TIMESTAMP DEFAULT NOW(),
          ip_address VARCHAR(45),
          user_agent TEXT,
          device_type VARCHAR(100),
          browser VARCHAR(100),
          status VARCHAR(20) DEFAULT 'success',
          two_factor_used BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Verificar y agregar columnas faltantes si es necesario
      const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'access_logs'
      `);
      
      const existingColumns = columns.rows.map(row => row.column_name);
      
      // Agregar columnas faltantes una por una
      if (!existingColumns.includes('login_time')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN login_time TIMESTAMP DEFAULT NOW()`);
        console.log('✅ Agregada columna login_time');
      }
      if (!existingColumns.includes('device_type')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN device_type VARCHAR(100)`);
        console.log('✅ Agregada columna device_type');
      }
      if (!existingColumns.includes('browser')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN browser VARCHAR(100)`);
        console.log('✅ Agregada columna browser');
      }
      if (!existingColumns.includes('status')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN status VARCHAR(20) DEFAULT 'success'`);
        console.log('✅ Agregada columna status');
      }
      if (!existingColumns.includes('two_factor_used')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN two_factor_used BOOLEAN DEFAULT false`);
        console.log('✅ Agregada columna two_factor_used');
      }
      if (!existingColumns.includes('ip_address')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN ip_address VARCHAR(45)`);
        console.log('✅ Agregada columna ip_address');
      }
      if (!existingColumns.includes('user_agent')) {
        await client.query(`ALTER TABLE access_logs ADD COLUMN user_agent TEXT`);
        console.log('✅ Agregada columna user_agent');
      }
      
    } catch (schemaError) {
      console.error('Error configurando tabla access_logs:', schemaError);
    }

    // Volver a obtener las columnas después de la migración
    const finalColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
    `);
    
    const availableColumns = finalColumns.rows.map(row => row.column_name);
    
    // Construir SELECT dinámicamente
    const selectColumns: string[] = [];
    
    if (availableColumns.includes('login_time')) {
      selectColumns.push('login_time');
    } else if (availableColumns.includes('created_at')) {
      selectColumns.push('created_at as login_time');
    } else {
      selectColumns.push('NOW() as login_time');
    }
    
    if (availableColumns.includes('ip_address')) {
      selectColumns.push('ip_address');
    } else {
      selectColumns.push("'Unknown' as ip_address");
    }
    
    if (availableColumns.includes('user_agent')) {
      selectColumns.push('user_agent');
    } else {
      selectColumns.push("'Unknown' as user_agent");
    }
    
    if (availableColumns.includes('device_type')) {
      selectColumns.push('device_type');
    } else {
      selectColumns.push("'Desktop' as device_type");
    }
    
    if (availableColumns.includes('browser')) {
      selectColumns.push('browser');
    } else {
      selectColumns.push("'Unknown' as browser");
    }
    
    // Verificar si existe 'status' o 'success'
    if (availableColumns.includes('status')) {
      selectColumns.push('status');
    } else if (availableColumns.includes('success')) {
      selectColumns.push("CASE WHEN success = true THEN 'success' ELSE 'failed' END as status");
    } else {
      selectColumns.push("'success' as status");
    }
    
    if (availableColumns.includes('two_factor_used')) {
      selectColumns.push('two_factor_used');
    } else {
      selectColumns.push('false as two_factor_used');
    }

    // Obtener los últimos 50 accesos del usuario
    const query = `
      SELECT DISTINCT ${selectColumns.join(', ')}
      FROM access_logs 
      WHERE user_id = $1 
      ORDER BY ${availableColumns.includes('login_time') ? 'login_time' : availableColumns.includes('created_at') ? 'created_at' : 'id'} DESC 
      LIMIT 50
    `;
    
    console.log('Executing query:', query);
    console.log('For user ID:', decoded.userId);
    
    const result = await client.query(query, [decoded.userId]);
    console.log('Raw DB results:', result.rows);

    // Formatear los datos para el frontend
    const accessHistory = result.rows.map((row, index) => {
      // Crear fecha directamente desde el timestamp de la BD
      const loginTime = new Date(row.login_time);
      
      // Formatear fecha con la zona horaria del navegador del usuario
      const formattedDate = loginTime.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Usar formato 24 horas
      });
      
      const ipFormatted = row.ip_address === '::1' || row.ip_address === '127.0.0.1' 
        ? '127.0.0.1 (Local)' 
        : row.ip_address || 'IP desconocida';
      
      // Mejorar la combinación de dispositivo y navegador
      let deviceDisplay = 'Dispositivo desconocido';
      if (row.device_type && row.browser) {
        deviceDisplay = `${row.device_type} • ${row.browser}`;
      } else if (row.device_type) {
        deviceDisplay = row.device_type;
      } else if (row.browser) {
        deviceDisplay = row.browser;
      } else if (row.user_agent) {
        // Fallback: analizar user agent en el frontend
        deviceDisplay = parseUserAgentFallback(row.user_agent);
      }
      
      return {
        id: `${row.login_time}_${index}`, // ID único para evitar duplicados
        date: formattedDate,
        ip: ipFormatted,
        device: deviceDisplay,
        userAgent: row.user_agent || 'User agent desconocido',
        status: row.status === 'success' ? 'Exitoso' : 'Fallido',
        twoFactorUsed: Boolean(row.two_factor_used),
        timestamp: row.login_time,
        rawData: row // Para debugging
      };
    });

    console.log('Formatted access history:', accessHistory);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: accessHistory,
        total: result.rows.length
      })
    };

  } catch (error) {
    console.error('Error al obtener historial de accesos:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
