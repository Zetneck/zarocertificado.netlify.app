import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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

  // Función para refrescar usuario (definida temprano para poder usarla en useEffects)
  const refreshUser = useCallback(async () => {
    try {
      console.log('🔄 Actualizando estado del usuario desde servidor...');
      const response = await authenticatedFetch(`${API_BASE}/user`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usuario actualizado:', {
          email: data.user.email,
          twoFactorEnabled: data.user.twoFactorEnabled,
          role: data.user.role
        });
        
        // Verificar si hay cambios importantes en el estado de 2FA
        if (user && user.twoFactorEnabled !== data.user.twoFactorEnabled) {
          console.log('🔄 Estado de 2FA cambió:', {
            anterior: user.twoFactorEnabled,
            nuevo: data.user.twoFactorEnabled
          });
        }
        
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        console.error('❌ Error al actualizar usuario: token inválido');
        // Token inválido, limpiar datos
        signOut();
      }
    } catch (error) {
      console.error('❌ Error al refrescar usuario:', error);
      // No hacer signOut automático en caso de error de red
      // para no desloguear al usuario innecesariamente
    }
  }, [user]);

  // Función signOut (necesaria para refreshUser)
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
    setRequiresSetup2FA(false);
    setTempUser(null);
    
    console.log('🔓 Sesión cerrada - todos los estados limpiados');
  };

  // Inicializar autenticación
  useEffect(() => {
    const initAuth = async () => {
      // ...existing initAuth code...
    };

    initAuth();
  }, []);

  // Sincronización periódica cuando la pestaña está activa
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let syncInterval: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        console.log('🔄 Pestaña activa, sincronizando estado...');
        refreshUser();
      }
    };

    // Agregar listener para cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sincronización periódica cada 5 minutos si la pestaña está activa
    const startPeriodicSync = () => {
      syncInterval = setInterval(() => {
        if (document.visibilityState === 'visible' && isAuthenticated) {
          console.log('🔄 Sincronización periódica...');
          refreshUser();
        }
      }, 5 * 60 * 1000); // 5 minutos
    };

    startPeriodicSync();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isAuthenticated, user, refreshUser]);

  // Inicializar autenticación
  useEffect(() => {
    const initAuth = async () => {
      // Initializing authentication...
      
      const token = localStorage.getItem('authToken');
      const tempToken = localStorage.getItem('tempToken');
      const savedUser = localStorage.getItem('user');
      const tempUserData = localStorage.getItem('tempUser');
      
      // Getting stored tokens and data...
      
      // CASO 1: Hay tempToken (proceso 2FA en curso)
      if (tempToken && !token) {
        // Restoring 2FA process state...
        
        if (tempUserData) {
          try {
            const parsedTempUser = JSON.parse(tempUserData);
            setTempUser(parsedTempUser);
            
            // Determinar si es setup o verificación basándose en si el usuario tiene 2FA configurado
            if (!parsedTempUser.twoFactorEnabled) {
              // User requires 2FA setup...
              setRequiresSetup2FA(true);
              setRequiresTwoFactor(false);
            } else {
              // User requires 2FA verification...
              setRequiresTwoFactor(true);
              setRequiresSetup2FA(false);
            }
            
            setIsAuthenticated(false);
            setUser(null);
          } catch (error) {
            console.error('❌ Error parsing temp user:', error);
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUser');
            setTempUser(null);
            setRequiresTwoFactor(false);
            setRequiresSetup2FA(false);
          }
        } else {
          // Orphaned tempToken, cleaning...
          localStorage.removeItem('tempToken');
          setTempUser(null);
          setRequiresTwoFactor(false);
          setRequiresSetup2FA(false);
        }
        
        setLoading(false);
        return;
      }
      
      // CASO 2: Hay authToken (usuario ya autenticado)
      if (token) {
        // AuthToken found, verifying authentication...
        
        try {
          // Siempre verificar con el servidor para obtener el estado más actualizado
          console.log('🔄 Verificando estado con el servidor...');
          const response = await authenticatedFetch(`${API_BASE}/user`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Estado sincronizado desde servidor:', {
              twoFactorEnabled: data.user.twoFactorEnabled,
              email: data.user.email
            });
            
            // Usar datos del servidor como fuente de verdad
            setUser(data.user);
            setIsAuthenticated(true);
            setRequiresTwoFactor(false);
            setRequiresSetup2FA(false);
            setTempUser(null);
            
            // Actualizar localStorage con datos frescos del servidor
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            console.log('❌ Token inválido, limpiando datos...');
            // Token invalid, cleaning data...
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUser');
            setUser(null);
            setIsAuthenticated(false);
            setRequiresTwoFactor(false);
            setRequiresSetup2FA(false);
            setTempUser(null);
          }
        } catch (error) {
          console.error('❌ Error al verificar autenticación:', error);
          
          // En caso de error de red, usar datos en caché SOLO temporalmente
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log('⚠️ Error de red, usando datos en caché temporalmente');
              setUser(parsedUser);
              setIsAuthenticated(true);
              setRequiresTwoFactor(false);
              setRequiresSetup2FA(false);
              setTempUser(null);
              
              // Intentar sincronizar en segundo plano después de un delay
              setTimeout(async () => {
                try {
                  console.log('🔄 Reintentando sincronización en segundo plano...');
                  const retryResponse = await authenticatedFetch(`${API_BASE}/user`);
                  if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    console.log('✅ Sincronización en segundo plano exitosa');
                    setUser(retryData.user);
                    localStorage.setItem('user', JSON.stringify(retryData.user));
                  }
                } catch (retryError) {
                  console.error('❌ Error en reintento de sincronización:', retryError);
                }
              }, 5000); // Reintentar después de 5 segundos
              
            } catch (parseError) {
              console.error('❌ Error parsing saved user on error:', parseError);
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('tempToken');
              localStorage.removeItem('tempUser');
              setUser(null);
              setIsAuthenticated(false);
              setRequiresTwoFactor(false);
              setRequiresSetup2FA(false);
              setTempUser(null);
            }
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUser');
            setUser(null);
            setIsAuthenticated(false);
            setRequiresTwoFactor(false);
            setRequiresSetup2FA(false);
            setTempUser(null);
          }
        }
      } else {
        // CASO 3: No hay tokens (usuario no autenticado)
        // No authToken, user not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setRequiresTwoFactor(false);
        setRequiresSetup2FA(false);
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
          // Token removed in another tab, logging out...
          signOut();
        } else if (e.newValue && !isAuthenticated) {
          // Token añadido, recargar autenticación
          // Token added in another tab, reloading authentication...
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
          // Token expired, logging out
          signOut();
        }
      } catch (error) {
        console.error('Error verifying token:', error);
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
      console.log('🔄 Intentando login:', { email });
      
      const response = await fetch(`${API_BASE}/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('📡 Respuesta del servidor:', { 
        ok: response.ok, 
        status: response.status, 
        data 
      });

      if (!response.ok) {
        console.log('❌ Error del servidor:', { 
          status: response.status, 
          error: data.error 
        });
        throw new Error(data.error || 'Error de autenticación');
      }

      // CASO 1: Usuario nuevo que necesita configurar 2FA
      if (data.requiresSetup2FA) {
        // User requires 2FA setup
        
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
        // User requires 2FA verification
        
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

      // CASO 3: Login directo (no debería ocurrir con 2FA obligatorio)
      // Warning: Direct login - review 2FA configuration
      
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
      console.error('❌ Error en signIn:', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
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
        console.log('✅ 2FA verificado exitosamente');
        
        // Limpiar datos temporales
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempUser');
        
        // Establecer autenticación final
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Actualizar estados - limpiar TODOS los estados de 2FA
        setUser(data.user);
        setIsAuthenticated(true);
        setRequiresTwoFactor(false);
        setRequiresSetup2FA(false);  // Asegurar que se limpia también este estado
        setTempUser(null);
        
        console.log('✅ Estados actualizados:', {
          isAuthenticated: true,
          requiresTwoFactor: false,
          requiresSetup2FA: false,
          user: data.user.email
        });
        
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
