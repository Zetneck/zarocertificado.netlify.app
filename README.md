# Generador de Certificados de Fumigación

Aplicación web moderna para la generación de certificados de fumigación con autenticación, gestión de usuarios y panel de administración.

## 🚀 Características

### ✅ Autenticación Real
- Sistema de login con JWT
- Gestión de usuarios (crear, editar, eliminar)
- Roles de usuario (admin, user)
- Integración con base de datos PostgreSQL (Neon)

### ✅ Gestión de Usuarios
- **Panel de Administración**: Solo accesible para administradores
- **Gestión de Créditos**: Asignación y modificación de créditos por usuario
- **Perfiles de Usuario**: Información completa del usuario
- **Configuración Personal**: Preferencias y configuraciones

### ✅ Interfaz Moderna
- **Design System**: Material-UI (MUI) con temas dark/light
- **Responsive**: Adaptativo a todos los dispositivos
- **UX Optimizada**: Navegación intuitiva y accesible

### ✅ Tecnología Avanzada
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Netlify Functions (serverless)
- **Base de Datos**: PostgreSQL en Neon (serverless)
- **Despliegue**: Netlify con integración continua

## 🏗️ Arquitectura

```
├── src/
│   ├── components/          # Componentes React
│   │   ├── AdminPanelOverlay.tsx    # Panel de administración
│   │   ├── UserMenu.tsx             # Menú de usuario
│   │   ├── UserProfile.tsx          # Perfil de usuario
│   │   ├── UserSettings.tsx         # Configuración de usuario
│   │   └── ...
│   ├── context/             # Context API
│   │   ├── AuthContextReal.tsx      # Contexto de autenticación
│   │   └── ...
│   ├── hooks/               # Custom hooks
│   │   ├── useAuthReal.ts           # Hook de autenticación
│   │   └── ...
│   └── utils/               # Utilidades
├── netlify/functions/       # Funciones serverless
│   ├── auth-login.ts        # Autenticación
│   ├── admin-users.ts       # Gestión de usuarios (admin)
│   ├── user.ts              # Operaciones de usuario
│   └── track-certificate.ts # Tracking de certificados
└── database-schema.sql      # Esquema de base de datos
```

## 🛠️ Configuración de Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta en Neon (PostgreSQL)
- Cuenta en Netlify

### Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/Zetneck/zarocertificado.netlify.app.git
cd fumigacion-certificado-app
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
   - En Netlify, configurar:
     - `DATABASE_URL`: URL de conexión a Neon
     - `JWT_SECRET`: Secreto para JWT (generar uno seguro)

4. **Ejecutar base de datos**:
   - Ejecutar `database-schema.sql` en tu instancia de Neon

5. **Desarrollo local**:
```bash
npm run dev
```

## 🚀 Despliegue

### Netlify (Producción)
1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Despliegue automático en cada push

### Variables de Entorno Requeridas
- `DATABASE_URL`: Conexión a PostgreSQL (Neon)
- `JWT_SECRET`: Secreto para tokens JWT

## 👥 Gestión de Usuarios

### Roles de Usuario
- **admin**: Acceso completo + panel de administración
- **user**: Acceso básico para generar certificados

### Panel de Administración
- Accesible desde: Menú Usuario → Panel de Administración
- Funciones:
  - Ver todos los usuarios
  - Crear nuevos usuarios
  - Modificar créditos
  - Eliminar usuarios
  - Ver estadísticas

### Usuarios de Prueba
```
Admin: admin@test.com / admin123
Usuario: user@test.com / user123
```

## 🔧 Estructura de Base de Datos

### Tablas Principales
- **users**: Información de usuarios, roles, créditos
- **access_logs**: Historial de accesos (seguridad)
- **certificate_usage**: Tracking de certificados generados

## 📝 Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build para producción
npm run preview    # Preview del build
npm run lint       # Análisis de código
```

## 🔐 Seguridad

- Autenticación JWT con expiración
- Validación de roles en frontend y backend
- Conexiones HTTPS obligatorias
- Variables de entorno para secretos

## 🌟 Próximas Características

- [ ] Autenticación de dos factores (2FA)
- [ ] Historial de accesos detallado
- [ ] Exportación de reportes
- [ ] API REST documentada
- [ ] Tests automatizados

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ usando React + TypeScript + Netlify + Neon**
