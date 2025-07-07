// Script de prueba para verificar la función verify-2fa
const API_BASE = 'https://zarocertificado.netlify.app/.netlify/functions';

async function testVerify2FA() {
  console.log('🔍 Probando función verify-2fa...');
  
  try {
    // Primero hacer login para obtener el tempToken
    console.log('1. Haciendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@zaro.com', 
        password: 'admin123' 
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginResponse.ok) {
      throw new Error(loginData.error || 'Error en login');
    }

    if (!loginData.user.twoFactorEnabled) {
      console.log('❌ Usuario no tiene 2FA habilitado');
      return;
    }

    const tempToken = loginData.token;
    console.log('2. Token temporal obtenido:', tempToken.substring(0, 20) + '...');

    // Probar códigos válidos
    const validCodes = ['123456', '000000', '111111'];
    
    for (const code of validCodes) {
      console.log(`3. Probando código: ${code}`);
      
      const verifyResponse = await fetch(`${API_BASE}/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code, 
          tempToken: tempToken 
        }),
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.log(`❌ Error response para código ${code}:`, errorText);
        continue;
      }

      const verifyData = await verifyResponse.json();
      console.log(`Resultado para código ${code}:`, verifyData);

      if (verifyData.success) {
        console.log(`✅ Código ${code} funcionó correctamente`);
        console.log('Token final:', verifyData.token.substring(0, 20) + '...');
        console.log('Usuario:', verifyData.user.name);
        break;
      } else {
        console.log(`❌ Código ${code} falló:`, verifyData.message || verifyData.error);
      }
    }

    // Probar código inválido
    console.log('4. Probando código inválido: 999999');
    const invalidResponse = await fetch(`${API_BASE}/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code: '999999', 
        tempToken: tempToken 
      }),
    });

    if (invalidResponse.ok) {
      const invalidData = await invalidResponse.json();
      console.log('Resultado para código inválido:', invalidData);
    } else {
      const errorText = await invalidResponse.text();
      console.log('Error response para código inválido:', errorText);
    }

  } catch (error) {
    console.error('Error en prueba:', error);
  }
}

// Ejecutar prueba si está en Node.js
if (typeof window === 'undefined') {
  testVerify2FA();
}
