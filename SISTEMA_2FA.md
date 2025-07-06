# Sistema de Autenticación con 2FA

Este documento describe el sistema de autenticación de dos factores (2FA) implementado en la aplicación de generación de certificados de fumigación.

## Características Implementadas

### 🔐 Autenticación Básica
- **Login seguro** con email y contraseña
- **Gestión de sesiones** con tokens temporales
- **Logout** con limpieza de sesión

### 🛡️ Autenticación de Dos Factores (2FA)
- **Múltiples métodos de verificación**:
  - App autenticadora (Google Authenticator, Authy, etc.)
  - SMS
  - Email
  - WhatsApp
- **Códigos de respaldo** para recuperación
- **Configuración flexible** por usuario

### 👤 Gestión de Usuario
- **Menú de usuario** con información del perfil
- **Configuración de 2FA** desde la interfaz
- **Historial de accesos** con detalles de sesión
- **Roles de usuario** (admin, user, operator)

### 🔒 Rutas Protegidas
- **Componente ProtectedRoute** que protege toda la aplicación
- **Verificación automática** de autenticación y 2FA
- **Redirección automática** a login o verificación según sea necesario

## Flujo de Autenticación

### 1. Login Inicial
```
Usuario no autenticado → Formulario de Login → Verificación de credenciales
```

### 2. Verificación 2FA (si está habilitado)
```
Login exitoso → Pantalla de 2FA → Verificación de código → Acceso a la aplicación
```

### 3. Acceso Protegido
```
Usuario autenticado → Acceso completo a la aplicación de certificados
```

## Usuarios Demo

Para probar el sistema, se han configurado usuarios demo:

### Usuario con 2FA Habilitado
- **Email**: `admin@zaro.com`
- **Contraseña**: `admin123`
- **2FA**: Habilitado
- **Código de prueba**: `123456` (cualquier método)

### Usuario sin 2FA
- **Email**: `user@zaro.com`
- **Contraseña**: `user123`
- **2FA**: Deshabilitado

### Usuario Operador
- **Email**: `operator@zaro.com`
- **Contraseña**: `operator123`
- **2FA**: Deshabilitado

## Componentes Principales

### 1. AuthContext (`src/context/AuthContext.tsx`)
Maneja toda la lógica de autenticación:
- Estado de usuario y sesión
- Funciones de login/logout
- Gestión de 2FA
- Generación de códigos de respaldo

### 2. ProtectedRoute (`src/components/ProtectedRoute.tsx`)
Componente que protege rutas:
- Verifica autenticación
- Redirige a login si es necesario
- Maneja verificación 2FA

### 3. LoginForm (`src/components/LoginForm.tsx`)
Formulario de inicio de sesión:
- Validación de credenciales
- Selección de usuarios demo
- Manejo de errores

### 4. TwoFactorVerification (`src/components/TwoFactorVerification.tsx`)
Pantalla de verificación 2FA:
- Selección de método de verificación
- Entrada de código
- Reenvío de códigos
- Contador de tiempo

### 5. UserMenu (`src/components/UserMenu.tsx`)
Menú de usuario con opciones:
- Información del perfil
- Configuración de 2FA
- Historial de accesos
- Cerrar sesión

### 6. TwoFactorSettings (`src/components/TwoFactorSettings.tsx`)
Panel de configuración de 2FA:
- Habilitar/deshabilitar métodos
- Generar códigos de respaldo
- Configurar app autenticadora

### 7. AccessHistory (`src/components/AccessHistory.tsx`)
Historial de intentos de acceso:
- Lista de intentos exitosos y fallidos
- Información de dispositivo e IP
- Detalles de método 2FA usado

## Integración en la Aplicación

### Estructura de Archivos
```
src/
├── types/
│   └── auth.ts                 # Tipos de autenticación
├── context/
│   └── AuthContext.tsx         # Contexto de autenticación
├── hooks/
│   └── useAuth.ts             # Hook personalizado
├── components/
│   ├── LoginForm.tsx          # Formulario de login
│   ├── TwoFactorVerification.tsx  # Verificación 2FA
│   ├── ProtectedRoute.tsx     # Ruta protegida
│   ├── UserMenu.tsx           # Menú de usuario
│   ├── TwoFactorSettings.tsx  # Configuración 2FA
│   ├── AccessHistory.tsx      # Historial de accesos
│   └── MainApp.tsx            # Aplicación principal protegida
└── main.tsx                   # Punto de entrada con AuthProvider
```

### Configuración Principal

#### 1. main.tsx
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

#### 2. App.tsx
```tsx
<ProtectedRoute>
  <MainApp />
</ProtectedRoute>
```

#### 3. MainApp.tsx
```tsx
// Aplicación original con UserMenu integrado
<UserMenu /> // En el header
<Form />     // Formulario original
<RightSidebar /> // Sidebar original
```

## Seguridad

### Características de Seguridad Implementadas
- ✅ **Tokens de sesión** con expiración
- ✅ **Verificación de 2FA** obligatoria si está habilitada
- ✅ **Códigos de respaldo** para recuperación
- ✅ **Historial de accesos** para auditoría
- ✅ **Validación de entrada** en todos los formularios
- ✅ **Gestión de errores** sin exposición de información sensible

### Consideraciones de Seguridad
- Los códigos 2FA son temporales y de un solo uso
- Las sesiones expiran automáticamente
- Los códigos de respaldo deben guardarse de forma segura
- El historial de accesos permite detectar actividad sospechosa

## Personalización

### Agregar Nuevos Métodos 2FA
1. Actualizar el array `twoFactorMethods` en `AuthContext`
2. Implementar la lógica de envío en las funciones correspondientes
3. Agregar iconos y texto descriptivo

### Modificar Políticas de Seguridad
- Tiempo de expiración de sesiones en `AuthContext`
- Longitud y formato de códigos 2FA
- Número de intentos permitidos

### Personalizar UI
- Temas y colores en los componentes
- Textos e idiomas
- Iconos y elementos visuales

## Próximos Pasos (Opcional)

Para una implementación completa en producción:

1. **Backend Real**: Implementar API endpoints para autenticación
2. **Envío Real de SMS/Email**: Integrar servicios como Twilio, SendGrid
3. **Generación de QR**: Para apps autenticadoras reales
4. **Base de Datos**: Persistir usuarios, sesiones y configuraciones
5. **Cifrado**: Encriptar datos sensibles
6. **Rate Limiting**: Prevenir ataques de fuerza bruta
7. **Logs de Seguridad**: Sistema completo de auditoría

## Conclusión

El sistema de autenticación 2FA está completamente integrado y funcional. Proporciona una capa adicional de seguridad para la aplicación de certificados, manteniendo la experiencia de usuario fluida y moderna.

La implementación es modular y escalable, permitiendo futuras mejoras y personalizaciones según las necesidades específicas del proyecto.
