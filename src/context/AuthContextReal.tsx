import { createContext, useState, useEffect, type ReactNode } from 'react';

interface UserSettings {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  autoSave?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'operator';
  phone?: string;
  department?: string;
  credits: number;
  twoFactorEnabled: boolean;
  settings?: UserSettings;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  requiresTwoFactor: boolean;
  requiresSetup2FA: boolean;
  tempUser: User | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean; requiresSetup2FA?: boolean }>;
  verifyTwoFactor: (code: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  updateUserSettings: (settingsData: UserSettings) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  trackCertificate: (folio: string, placas: string) => Promise<void>;
  toggleTwoFactor: () => Promise<{ success: boolean; message: string }>;
  completeSetup2FA: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [requiresSetup2FA, setRequiresSetup2FA] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  // API base URL
  const API_BASE = '/.netlify/functions';

  // Función para hacer requests autenticados
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  };

  // Inicializar autenticación
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const tempToken = localStorage.getItem('tempToken');
      const savedUser = localStorage.getItem('user');
      
      console.log('🔍 initAuth - tokens:', { 
        authToken: !!token, 
        tempToken: !!tempToken,
        savedUser: !!savedUser 
      });
      
      // Si hay un tempToken, significa que estamos en proceso de 2FA
      if (tempToken && !token) {
        console.log('🔍 Proceso 2FA en curso - no autenticar aún');
        const tempUserData = localStorage.getItem('tempUser');
        if (tempUserData) {
          try {
            const parsedTempUser = JSON.parse(tempUserData);
            setTempUser(parsedTempUser);
            setRequiresTwoFactor(true);
            setIsAuthenticated(false);
          } catch (error) {
            console.error('Error parsing temp user:', error);
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUser');
          }
        }
        setLoading(false);
        return;
      }
      
      // Si hay authToken, verificar autenticación normal
      if (token) {
        try {
          // Primero intentar usar el usuario guardado
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log('🔍 Usuario encontrado en localStorage:', parsedUser.email);
              setUser(parsedUser);
              setIsAuthenticated(true);
              setRequiresTwoFactor(false);
              setTempUser(null);
            } catch (error) {
              console.error('Error parsing saved user:', error);
            }
          }
          
          // Verificar token con el servidor
          console.log('🔍 Verificando token con servidor...');
          const response = await authenticatedFetch(`${API_BASE}/user`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Usuario verificado con servidor:', data.user.email);
            setUser(data.user);
            setIsAuthenticated(true);
            setRequiresTwoFactor(false);
            setTempUser(null);
            
            // Actualizar localStorage con datos frescos del servidor
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ Usuario actualizado en localStorage');
          } else {
            console.log('❌ Token inválido, limpiando datos...');
            // Token inválido, limpiar
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUser');
            setUser(null);
            setIsAuthenticated(false);
            setRequiresTwoFactor(false);
            setTempUser(null);
          }
        } catch (error) {
          console.error('❌ Error al verificar autenticación:', error);
          // En caso de error de red, mantener el usuario si existe en localStorage
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log('⚠️ Error de red, usando usuario guardado:', parsedUser.email);
              setUser(parsedUser);
              setIsAuthenticated(true);
              setRequiresTwoFactor(false);
              setTempUser(null);
            } catch (parseError) {
              console.error('Error parsing saved user on error:', parseError);
              // Si no se puede parsear, limpiar todo
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('tempToken');
              localStorage.removeItem('tempUser');
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // No hay usuario guardado, limpiar todo
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUser');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        console.log('🔍 No hay authToken, usuario no autenticado');
        setUser(null);
        setIsAuthenticated(false);
        setRequiresTwoFactor(false);
        setTempUser(null);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listener para cambios en localStorage (útil para múltiples pestañas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        if (e.newValue === null) {
          // Token eliminado, cerrar sesión
          console.log('🔍 Token eliminado en otra pestaña - cerrando sesión');
          signOut();
        } else if (e.newValue && !isAuthenticated) {
          // Token añadido, recargar autenticación
          console.log('🔍 Token añadido en otra pestaña - recargando autenticación');
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  // Verificación periódica del token (cada 5 minutos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const verifyTokenPeriodically = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await authenticatedFetch(`${API_BASE}/user`);
        if (!response.ok) {
          console.log('🔍 Token expirado, cerrando sesión');
          signOut();
        }
      } catch (error) {
        console.log('🔍 Error verificando token:', error);
        // No cerrar sesión por errores de red
      }
    };

    // Verificar inmediatamente y luego cada 5 minutos
    verifyTokenPeriodically();
    const interval = setInterval(verifyTokenPeriodically, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      console.log('🔍 Iniciando login con debug para:', email);
      
      const response = await fetch(`${API_BASE}/debug-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔍 Respuesta del debug-login:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      console.log('🔍 Datos recibidos del login:', data);

      // CASO 1: Usuario nuevo que necesita configurar 2FA
      if (data.requiresSetup2FA) {
        console.log('🆕 Usuario nuevo - requiere configuración 2FA');
        
        // Limpiar autenticación previa
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Guardar datos temporales para setup
        setTempUser(data.user);
        setRequiresSetup2FA(true);
        setRequiresTwoFactor(false);
        setIsAuthenticated(false);
        setUser(null);
        
        localStorage.setItem('tempToken', data.tempToken);
        localStorage.setItem('tempUser', JSON.stringify(data.user));
        
        return { success: true, requiresSetup2FA: true };
      }

      // CASO 2: Usuario existente que requiere verificación 2FA
      if (data.requiresTwoFactor) {
        console.log('🔐 Usuario existente - requiere verificación 2FA');
        
        // Limpiar cualquier autenticación previa
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Guardar datos temporales para el proceso 2FA
        setTempUser(data.user || { email }); // En caso de que no venga user completo
        setRequiresTwoFactor(true);
        setRequiresSetup2FA(false);
        setIsAuthenticated(false);
        setUser(null);
        
        localStorage.setItem('tempToken', data.tempToken);
        if (data.user) {
          localStorage.setItem('tempUser', JSON.stringify(data.user));
        }
        
        return { success: true, requiresTwoFactor: true };
      }

      // CASO 3: Login de emergencia o caso especial (no debería ocurrir normalmente)
      console.log('⚠️ Login directo - revisar configuración 2FA');
      
      // Limpiar cualquier proceso previo
      localStorage.removeItem('tempToken');
      localStorage.removeItem('tempUser');
      
      // Login directo
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      setRequiresTwoFactor(false);
      setRequiresSetup2FA(false);
      setTempUser(null);
      
      return { success: true, requiresTwoFactor: false };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    // Limpiar todos los tokens y datos
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('tempUser');
    
    // Limpiar todos los estados
    setUser(null);
    setIsAuthenticated(false);
    setRequiresTwoFactor(false);
    setTempUser(null);
    
    console.log('🔍 SignOut - todos los estados limpiados');
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/user`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
      throw new Error(message);
    }
  };

  const updateUserSettings = async (settingsData: UserSettings) => {
    try {
      const currentSettings = user?.settings || {};
      const newSettings = { ...currentSettings, ...settingsData };
      
      await updateUserProfile({ settings: newSettings });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar configuración';
      throw new Error(message);
    }
  };

  const deleteAccount = async () => {
    try {
      // Por simplicidad, solo hacer signOut
      // En una implementación real, harías una llamada DELETE a la API
      signOut();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar cuenta';
      throw new Error(message);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/user`);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  const trackCertificate = async (folio: string, placas: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/track-certificate`, {
        method: 'POST',
        body: JSON.stringify({ folio, placas }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al registrar certificado');
      }

      // Refrescar usuario para actualizar créditos
      await refreshUser();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar certificado';
      throw new Error(message);
    }
  };

  // Función para habilitar/deshabilitar 2FA
  const toggleTwoFactor = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const response = await authenticatedFetch(`${API_BASE}/toggle-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enable: !user.twoFactorEnabled
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar configuración 2FA');
      }

      // Actualizar el estado del usuario
      setUser(prev => prev ? { ...prev, twoFactorEnabled: !prev.twoFactorEnabled } : null);
      
      return {
        success: true,
        message: user.twoFactorEnabled 
          ? 'Autenticación de dos factores deshabilitada' 
          : 'Autenticación de dos factores habilitada'
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cambiar configuración 2FA';
      return {
        success: false,
        message
      };
    }
  };

  // Función para verificar código 2FA
  const verifyTwoFactor = async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('🔍 Verificando código 2FA:', code);
      
      const tempToken = localStorage.getItem('tempToken');
      if (!tempToken) {
        console.log('❌ No hay token temporal');
        return { success: false, message: 'Sesión expirada. Vuelve a iniciar sesión.' };
      }

      // Llamar a la función serverless para verificar el código
      const response = await fetch(`${API_BASE}/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(), 
          tempToken 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('❌ Error en verificación 2FA:', data.error);
        return { success: false, message: data.message || data.error || 'Error en verificación' };
      }

      if (data.success) {
        // Limpiar datos temporales
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempUser');
        
        // Establecer autenticación final
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Actualizar estados
        setUser(data.user);
        setIsAuthenticated(true);
        setRequiresTwoFactor(false);
        setTempUser(null);
        
        console.log('✅ 2FA verificado - usuario autenticado');
        return { success: true, message: data.message || 'Verificación exitosa' };
      } else {
        console.log('❌ Código 2FA incorrecto');
        return { success: false, message: data.message || 'Código incorrecto' };
      }
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en verificación 2FA';
      console.error('❌ Error en verificación 2FA:', message);
      return { success: false, message: 'Error de conexión. Inténtalo de nuevo.' };
    }
  };

  // Función para completar el setup de 2FA para usuarios nuevos
  const completeSetup2FA = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!tempUser) {
        throw new Error('No hay sesión temporal de setup');
      }

      const tempToken = localStorage.getItem('tempToken');
      if (!tempToken) {
        throw new Error('Token temporal expirado');
      }

      // Habilitar 2FA para el usuario
      const response = await fetch(`${API_BASE}/toggle-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          enable: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al activar 2FA');
      }

      // Generar token de autenticación final para el usuario
      const loginResponse = await fetch(`${API_BASE}/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: tempUser.email, 
          password: 'SETUP_COMPLETE' // Flag especial para completar setup
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        
        // Limpiar datos temporales
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempUser');
        
        // Establecer autenticación completa
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        
        setUser({ ...tempUser, twoFactorEnabled: true });
        setIsAuthenticated(true);
        setRequiresSetup2FA(false);
        setRequiresTwoFactor(false);
        setTempUser(null);
      } else {
        // Si falla el login final, al menos activamos 2FA
        setUser({ ...tempUser, twoFactorEnabled: true });
        setRequiresSetup2FA(false);
      }
      
      return {
        success: true,
        message: '✅ 2FA configurado correctamente. Tu cuenta ahora está protegida.'
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al completar configuración 2FA';
      return {
        success: false,
        message
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    requiresTwoFactor,
    requiresSetup2FA,
    tempUser,
    signIn,
    verifyTwoFactor,
    signOut,
    updateUserProfile,
    updateUserSettings,
    deleteAccount,
    refreshUser,
    trackCertificate,
    toggleTwoFactor,
    completeSetup2FA,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
