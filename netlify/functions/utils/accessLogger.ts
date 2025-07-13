import { Client } from 'pg';

interface AccessLogData {
  userId: number;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  twoFactorUsed: boolean;
}

export async function logAccess(client: Client, data: AccessLogData): Promise<void> {
  try {
    // Detectar tipo de dispositivo y navegador
    const deviceInfo = parseUserAgent(data.userAgent);
    
    console.log('📝 Logging access with data:', {
      userId: data.userId,
      ipAddress: data.ipAddress,
      status: data.status,
      twoFactorUsed: data.twoFactorUsed,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      userAgent: data.userAgent
    });

    // Asegurar que la tabla access_logs existe
    try {
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
      console.log('✅ Tabla access_logs verificada/creada');
    } catch (tableError) {
      console.error('⚠️ Error creando tabla access_logs:', tableError);
      // Continuar de todas formas, la tabla podría existir
    }

    // Verificar si ya existe un registro reciente (últimos 30 segundos) para evitar duplicados
    try {
      const recentCheck = await client.query(`
        SELECT id FROM access_logs 
        WHERE user_id = $1 
        AND ip_address = $2 
        AND status = $3
        AND login_time > NOW() - INTERVAL '30 seconds'
        ORDER BY login_time DESC 
        LIMIT 1
      `, [data.userId, data.ipAddress, data.status]);

      if (recentCheck.rows.length > 0) {
        console.log('⚠️ Skipping duplicate access log entry within 30 seconds');
        return;
      }
    } catch (duplicateError) {
      console.log('⚠️ No se pudo verificar duplicados (tabla nueva?):', duplicateError.message);
      // Continuar con la inserción
    }
    
    // Verificar si las columnas existen antes de insertar
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
    `);
    
    const existingColumns = columns.rows.map(row => row.column_name);
    console.log('📋 Available columns in access_logs:', existingColumns);
    
    // Construir query dinámicamente basado en columnas existentes
    let insertQuery = `INSERT INTO access_logs (user_id`;
    const values: (string | number | boolean | Date)[] = [data.userId];
    let valueIndexes = '$1';
    
    if (existingColumns.includes('ip_address')) {
      insertQuery += ', ip_address';
      values.push(data.ipAddress);
      valueIndexes += ', $' + values.length;
    }
    
    if (existingColumns.includes('user_agent')) {
      insertQuery += ', user_agent';
      values.push(data.userAgent);
      valueIndexes += ', $' + values.length;
    }
    
    if (existingColumns.includes('status')) {
      insertQuery += ', status';
      values.push(data.status);
      valueIndexes += ', $' + values.length;
    }
    
    if (existingColumns.includes('device_type')) {
      insertQuery += ', device_type';
      values.push(deviceInfo.device);
      valueIndexes += ', $' + values.length;
    }
    
    if (existingColumns.includes('browser')) {
      insertQuery += ', browser';
      values.push(deviceInfo.browser);
      valueIndexes += ', $' + values.length;
    }
    
    if (existingColumns.includes('two_factor_used')) {
      insertQuery += ', two_factor_used';
      values.push(data.twoFactorUsed);
      valueIndexes += ', $' + values.length;
    }
    
    // Si existe login_time, usarla; si no, usar created_at
    if (existingColumns.includes('login_time')) {
      insertQuery += ', login_time';
      values.push(new Date()); // Usar hora UTC del servidor
      valueIndexes += ', $' + values.length;
    }
    
    insertQuery += `) VALUES (${valueIndexes})`;
    
    console.log('📝 Insert query:', insertQuery);
    console.log('📝 Insert values:', values);
    
    const insertResult = await client.query(insertQuery, values);
    console.log('✅ Insert result:', insertResult);
    
    console.log('✅ Access logged successfully:', { 
      userId: data.userId, 
      status: data.status,
      insertedRows: insertResult.rowCount 
    });
  } catch (error) {
    console.error('❌ Error logging access:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: data.userId,
      status: data.status
    });
    // No fallar el login por un error de logging
  }
}

function parseUserAgent(userAgent: string): { device: string; browser: string } {
  if (!userAgent) {
    return { device: 'Desktop', browser: 'Navegador desconocido' };
  }

  const ua = userAgent.toLowerCase();
  console.log('Parsing User Agent:', userAgent);
  
  // Detectar dispositivo más específico
  let device = 'Desktop';
  if (ua.includes('iphone')) {
    device = 'iPhone';
  } else if (ua.includes('ipad')) {
    device = 'iPad';
  } else if (ua.includes('android') && ua.includes('mobile')) {
    device = 'Android Mobile';
  } else if (ua.includes('android')) {
    device = 'Android Tablet';
  } else if (ua.includes('mobile')) {
    device = 'Mobile';
  } else if (ua.includes('tablet')) {
    device = 'Tablet';
  } else if (ua.includes('windows nt 10')) {
    device = 'Windows 10/11';
  } else if (ua.includes('windows nt 6.3')) {
    device = 'Windows 8.1';
  } else if (ua.includes('windows nt 6.1')) {
    device = 'Windows 7';
  } else if (ua.includes('windows')) {
    device = 'Windows';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    device = 'macOS';
  } else if (ua.includes('linux')) {
    device = 'Linux';
  }
  
  // Detectar navegador más específico
  let browser = 'Navegador desconocido';
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg') && !ua.includes('opera')) {
    // Extraer versión de Chrome
    const chromeMatch = ua.match(/chrome\/(\d+)/);
    const version = chromeMatch ? chromeMatch[1] : '';
    browser = version ? `Chrome ${version}` : 'Chrome';
  } else if (ua.includes('firefox/')) {
    // Extraer versión de Firefox
    const firefoxMatch = ua.match(/firefox\/(\d+)/);
    const version = firefoxMatch ? firefoxMatch[1] : '';
    browser = version ? `Firefox ${version}` : 'Firefox';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  } else if (ua.includes('msie') || ua.includes('trident')) {
    browser = 'Internet Explorer';
  }
  
  console.log('Detected device:', device, 'browser:', browser);
  return { device, browser };
}

export function getClientIP(event: { headers: { [key: string]: string | undefined }; clientContext?: { ip?: string } }): string {
  // Netlify Functions headers
  const ip = (event.headers['x-forwarded-for'] ||
         event.headers['x-real-ip'] ||
         event.headers['x-client-ip'] ||
         event.clientContext?.ip ||
         'Unknown') as string;
         
  // Si es una IP local de desarrollo, hacer más amigable
  if (ip === '::1') {
    return '127.0.0.1 (Desarrollo local)';
  } else if (ip === '127.0.0.1') {
    return '127.0.0.1 (Desarrollo local)';
  }
  
  return ip;
}
