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
  tempUser: User | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean }>;
  verifyTwoFactor: (code: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  updateUserSettings: (settingsData: UserSettings) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  trackCertificate: (folio: string, placas: string) => Promise<void>;
  toggleTwoFactor: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
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
      
      if (token) {
        try {
          const response = await authenticatedFetch(`${API_BASE}/user`);
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpiar
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      console.log('🔍 Datos recibidos del login:', data);
      console.log('🔍 Usuario twoFactorEnabled:', data.user.twoFactorEnabled);

      // Verificar si el usuario tiene 2FA habilitado
      if (data.user.twoFactorEnabled) {
        console.log('✅ 2FA requerido - mostrando pantalla de verificación');
        // Guardar usuario temporalmente (sin autenticar completamente)
        setTempUser(data.user);
        setRequiresTwoFactor(true);
        localStorage.setItem('tempToken', data.token);
        return { success: true, requiresTwoFactor: true };
      } else {
        console.log('❌ 2FA no requerido - login directo');
        // Login normal sin 2FA
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsAuthenticated(true);
        setRequiresTwoFactor(false);
        setTempUser(null);
        
        return { success: true, requiresTwoFactor: false };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
    setUser(null);
    setIsAuthenticated(false);
    setRequiresTwoFactor(false);
    setTempUser(null);
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
      // Verificar código demo (123456)
      if (code === '123456' && tempUser) {
        // Mover usuario temporal a usuario autenticado
        const tempToken = localStorage.getItem('tempToken');
        if (tempToken) {
          localStorage.setItem('authToken', tempToken);
          localStorage.setItem('user', JSON.stringify(tempUser));
          localStorage.removeItem('tempToken');
          
          setUser(tempUser);
          setIsAuthenticated(true);
          setRequiresTwoFactor(false);
          setTempUser(null);
          
          return { success: true, message: 'Verificación exitosa' };
        }
      }
      
      return { success: false, message: 'Código incorrecto. Usa: 123456' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en verificación 2FA';
      return { success: false, message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    requiresTwoFactor,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
