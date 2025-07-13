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
    // La tabla access_logs ya existe con la estructura correcta
    console.log('🔍 Obteniendo historial para usuario:', decoded.userId);
    
    // Verificar columnas disponibles en la tabla real
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
    `);
    
    const availableColumns = columns.rows.map(row => row.column_name);
    console.log('📋 Columnas disponibles:', availableColumns);
    
    // Construir SELECT para la estructura real de la tabla
    let selectColumns = `
      id,
      user_id,
      ip_address,
      user_agent,
      device_type,
      browser,
      two_factor_used,
      created_at,
      login_time
    `;
    
    // Manejar la columna success/status
    if (availableColumns.includes('success')) {
      selectColumns += `, CASE WHEN success = true THEN 'success' ELSE 'failed' END as status`;
    } else if (availableColumns.includes('status')) {
      selectColumns += `, status`;
    }

    // Obtener los últimos 50 accesos del usuario
    const query = `
      SELECT ${selectColumns}
      FROM access_logs 
      WHERE user_id = $1 
      ORDER BY COALESCE(login_time, created_at) DESC 
      LIMIT 50
    `;
    
    console.log('📝 Query ejecutando:', query);
    console.log('📝 Para usuario:', decoded.userId);
    
    const result = await client.query(query, [decoded.userId]);
    console.log(`✅ Encontrados ${result.rows.length} registros de acceso`);
    console.log('🔍 Primeros registros:', result.rows.slice(0, 3));
    
    if (result.rows.length === 0) {
      console.log('⚠️ No se encontraron registros de acceso para el usuario');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: [],
          total: 0,
          message: 'No hay registros de acceso'
        })
      };
    }

    // Procesar cada registro
    const accessHistory = result.rows.map((row, index) => {
      // Usar login_time si está disponible, si no usar created_at
      const loginTime = new Date(row.login_time || row.created_at);
      
      // Formatear fecha con la zona horaria de México (UTC-6)
      const formattedDate = loginTime.toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Formatear IP de manera amigable
      let ipFormatted = row.ip_address || 'IP desconocida';
      if (ipFormatted.includes('127.0.0.1') || ipFormatted.includes('::1')) {
        ipFormatted += ' (Local)';
      }

      // Obtener información del dispositivo
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
        id: `${row.login_time || row.created_at}_${index}`, // ID único para evitar duplicados
        date: formattedDate,
        ip: ipFormatted,
        device: deviceDisplay,
        userAgent: row.user_agent || 'User agent desconocido',
        status: row.status === 'success' ? 'Exitoso' : 'Fallido',
        twoFactorUsed: Boolean(row.two_factor_used),
        timestamp: row.login_time || row.created_at,
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
