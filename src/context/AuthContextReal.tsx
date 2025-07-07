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
  signIn: (email: string, password: string) => Promise<{ success: boolean }>;
  signOut: () => void;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  updateUserSettings: (settingsData: UserSettings) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  trackCertificate: (folio: string, placas: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

      // Guardar token y datos del usuario
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true };
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
    setUser(null);
    setIsAuthenticated(false);
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

  const value = {
    user,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    updateUserProfile,
    updateUserSettings,
    deleteAccount,
    refreshUser,
    trackCertificate,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
