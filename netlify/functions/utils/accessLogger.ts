import { Client } from 'pg';

interface AccessLogData {
  userId: string; // UUID string
  ipAddress: string;
  userAgent: string;
  success: boolean; // boolean success instead of status string
  twoFactorUsed: boolean;
}

export async function logAccess(client: Client, data: AccessLogData): Promise<void> {
  console.log('🚀 INICIO logAccess con datos:', JSON.stringify(data, null, 2));
  
  try {
    // Detectar tipo de dispositivo y navegador
    const deviceInfo = parseUserAgent(data.userAgent);
    
    console.log('📝 Logging access with data:', {
      userId: data.userId,
      ipAddress: data.ipAddress,
      success: data.success,
      twoFactorUsed: data.twoFactorUsed,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      userAgent: data.userAgent
    });

    // La tabla access_logs ya existe con la estructura correcta
    // No necesitamos crearla, solo verificar que podemos acceder
    try {
      await client.query(`SELECT 1 FROM access_logs LIMIT 1`);
      console.log('✅ Tabla access_logs verificada');
    } catch (tableError) {
      console.error('⚠️ Error verificando tabla access_logs:', tableError);
      // La tabla podría no existir o tener permisos incorrectos
    }

    // Verificar duplicados solo para logins exitosos muy recientes (5 segundos)
    // Para logins fallidos, siempre registrar
    if (data.success) {
      try {
        const recentCheck = await client.query(`
          SELECT id FROM access_logs 
          WHERE user_id = $1 
          AND success = true
          AND login_time > NOW() - INTERVAL '5 seconds'
          ORDER BY login_time DESC 
          LIMIT 1
        `, [data.userId]);

        if (recentCheck.rows.length > 0) {
          console.log('⚠️ Skipping duplicate successful login within 5 seconds for user:', data.userId);
          return;
        }
      } catch (duplicateError) {
        console.log('⚠️ No se pudo verificar duplicados, continuando con inserción:', duplicateError.message);
        // Continuar con la inserción ya que es mejor registrar que perder el registro
      }
    } else {
      console.log('📝 Registrando login fallido (sin verificar duplicados)');
    }
    
    // Verificar si las columnas existen antes de insertar
    console.log('🔍 Verificando columnas de la tabla...');
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'access_logs'
    `);
    
    const existingColumns = columns.rows.map(row => row.column_name);
    console.log('📋 Available columns in access_logs:', existingColumns);
    
    if (existingColumns.length === 0) {
      throw new Error('La tabla access_logs no existe o no tiene columnas');
    }
      // Construir query dinámicamente basado en columnas existentes
    console.log('🔧 Construyendo query de inserción...');
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
    
    if (existingColumns.includes('success')) {
      insertQuery += ', success';
      values.push(data.success);
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
    
    // Agregar timestamp
    if (existingColumns.includes('login_time')) {
      insertQuery += ', login_time';
      values.push(new Date()); // Usar hora UTC del servidor
      valueIndexes += ', $' + values.length;
    }

    insertQuery += `) VALUES (${valueIndexes}) RETURNING *`;
    
    console.log('📝 Query final:', insertQuery);
    console.log('📝 Valores:', values);
    console.log('📝 Tipos de valores:', values.map(v => typeof v));
    
    console.log('⚡ Ejecutando inserción...');
    const insertResult = await client.query(insertQuery, values);
    console.log('✅ Resultado de inserción:', insertResult.rows[0]);
    console.log('📊 Filas afectadas:', insertResult.rowCount);
    
    console.log('✅ Access logged successfully:', { 
      userId: data.userId, 
      success: data.success,
      insertedId: insertResult.rows[0]?.id,
      insertedRows: insertResult.rowCount 
    });
  } catch (error) {
    console.error('❌ Error logging access:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: data.userId,
      success: data.success
    });
    // No fallar el login por un error de logging
  }
}

function parseUserAgent(userAgent: string): { device: string; browser: string } {
  if (!userAgent) {
    return { device: 'Desktop', browser: 'Navegador desconocido' };
  }

  const ua = userAgent.toLowerCase();
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
  
  return { device, browser };
}

export function getClientIP(event: { headers: { [key: string]: string | undefined }; clientContext?: { ip?: string } }): string {
  // Obtener posibles fuentes
  let raw = (event.headers['x-forwarded-for'] ||
             event.headers['x-real-ip'] ||
             event.headers['x-client-ip'] ||
             event.clientContext?.ip ||
             '') as string;

  // x-forwarded-for puede contener una lista "client, proxy1, proxy2" → tomar la primera
  if (raw.includes(',')) {
    raw = raw.split(',')[0].trim();
  }

  // Remover posibles puertos (1.2.3.4:5678)
  if (raw.includes(':') && !raw.includes('::')) {
    // IPv4 con puerto
    raw = raw.split(':')[0];
  }

  // Normalizar localhost
  if (raw === '::1' || raw === '' || raw.toLowerCase() === 'localhost') {
    return '127.0.0.1';
  }

  return raw;
}
