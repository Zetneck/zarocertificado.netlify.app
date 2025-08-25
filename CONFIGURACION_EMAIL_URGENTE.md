# CONFIGURACIÓN URGENTE DE EMAIL PARA PRODUCCIÓN

**PROBLEMA:** Los usuarios no reciben emails de recuperación de contraseña porque falta configurar el proveedor de email.

## Solución inmediata:

1. **Obtener API Key de Resend:**
   - Ir a https://resend.com/api-keys
   - Crear cuenta si no existe
   - Generar API Key (comienza con `re_`)

2. **Verificar dominio:**
   - En Resend, ir a "Domains"
   - Añadir tu dominio (ej: `zarocertificado.com`)
   - Configurar DNS records (SPF, DKIM)

3. **Configurar variables en Netlify:**
   ```bash
   RESEND_API_KEY=re_tu_api_key_aqui
   MAIL_FROM="ZARO Certificados <no-reply@zarocertificado.com>"
   PUBLIC_BASE_URL=https://zarocertificado.netlify.app
   APP_NAME=ZARO Certificados
   PASSWORD_RESET_TTL_MIN=30
   ```

4. **Redeploy el sitio** después de añadir las variables.

## Para decir a los clientes:
"Estamos resolviendo un problema técnico con el envío de emails. En las próximas horas estará funcionando correctamente. Mientras tanto, puedes contactarnos directamente para restablecer tu contraseña."

## Test rápido:
Una vez configurado, probar desde la web de producción el flujo "¿Olvidaste tu contraseña?" para confirmar que llega el email.
