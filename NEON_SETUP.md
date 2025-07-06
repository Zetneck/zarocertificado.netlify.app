# 🚀 Configuración de Neon Database

## 📋 Pasos para activar la base de datos real:

### 1. 🔧 Configurar Neon en Netlify
1. Ve a tu dashboard de Netlify
2. Entra a tu proyecto
3. Ve a "Integrations" 
4. Busca "Neon" y haz clic en "Enable"
5. Autoriza la conexión
6. Crea una nueva base de datos

### 2. 📊 Inicializar la base de datos
1. Ve al dashboard de Neon
2. Abre el SQL Editor
3. Copia y pega el contenido de `database-schema.sql`
4. Ejecuta el script

### 3. 🔐 Configurar variables de entorno
Netlify configurará automáticamente:
- `DATABASE_URL`: URL de conexión a Neon
- `JWT_SECRET`: Genera una clave secreta para JWT

Para generar JWT_SECRET puedes usar:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. 🔄 Activar el nuevo AuthContext
1. En `src/main.tsx`, reemplaza:
```typescript
// Cambiar de:
import { AuthProvider } from './context/AuthContext';

// A:
import { AuthProvider } from './context/AuthContextReal';
```

### 5. 🎯 Usuarios de prueba
Una vez configurada la BD, puedes usar:

**Administrador:**
- Email: `admin@zaro.com`
- Password: `admin123`
- Créditos: 1000

**Usuario normal:**
- Email: `user@zaro.com` 
- Password: `user123`
- Créditos: 25

**Operador:**
- Email: `operator@zaro.com`
- Password: `operator123`  
- Créditos: 50

## 🎉 ¡Beneficios!

✅ **Usuarios reales** - No más demo mode
✅ **Autenticación segura** - JWT + bcrypt
✅ **Persistencia** - Los datos no se pierden
✅ **Sistema de créditos** - Control real de uso
✅ **Tracking** - Registro de certificados generados
✅ **Multi-dispositivo** - Acceso desde cualquier lugar
✅ **Escalable** - Preparado para muchos usuarios

## 🔧 Funcionalidades implementadas:

- ✅ Login/logout real
- ✅ Gestión de perfil de usuario
- ✅ Sistema de créditos
- ✅ Tracking de certificados
- ✅ Logging de accesos
- ✅ Configuración de usuario

## 📱 Uso:
1. Los certificados siguen generándose como antes (PDF)
2. Ahora se registra cada generación en la BD
3. Se descuenta 1 crédito por certificado
4. Los usuarios tienen perfiles reales y persistentes

¡Tu aplicación ahora es completamente profesional! 🎊
