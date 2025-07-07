// Script para generar secreto TOTP y código QR para el usuario admin
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

async function generateAdminTOTP() {
  console.log('🔍 Generando secreto TOTP para admin@zaro.com...');
  
  try {
    // Generar secreto TOTP
    const secret = authenticator.generateSecret();
    
    // Configuración
    const serviceName = 'Zaro Certificados';
    const accountName = 'admin@zaro.com';
    
    // Generar URL para QR
    const otpauth = authenticator.keyuri(accountName, serviceName, secret);
    
    // Generar código QR como data URL
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);
    
    console.log('\n✅ Secreto TOTP generado exitosamente!');
    console.log('\n📊 Información del TOTP:');
    console.log('- Servicio:', serviceName);
    console.log('- Cuenta:', accountName);
    console.log('- Secreto:', secret);
    console.log('\n🔐 Para configurar en tu app autenticadora:');
    console.log('1. Opción 1: Escanea el código QR (guarda el qrCodeDataURL en un archivo HTML)');
    console.log('2. Opción 2: Ingresa manualmente esta clave:', secret);
    
    console.log('\n💾 Datos para actualizar en la base de datos:');
    console.log('UPDATE "User" SET "twoFactorSecret" = \'' + secret + '\', "twoFactorEnabled" = true WHERE email = \'admin@zaro.com\';');
    
    console.log('\n🖼️ Código QR Data URL (para mostrar):');
    console.log(qrCodeDataURL);
    
    // Generar código de prueba actual
    const currentToken = authenticator.generate(secret);
    console.log('\n🔢 Código actual (válido por ~30 segundos):', currentToken);
    
  } catch (error) {
    console.error('❌ Error generando TOTP:', error);
  }
}

generateAdminTOTP();
