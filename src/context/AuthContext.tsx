import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthSession, TwoFactorMethod, LoginAttempt, LoginCredentials, TwoFactorVerification } from '../types/auth';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAttempts: LoginAttempt[];
  twoFactorMethods: TwoFactorMethod[];
  pendingVerification: boolean;
  
  // Funciones de autenticación
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; requiresTwoFactor?: boolean; error?: string }>;
  verifyTwoFactor: (verification: TwoFactorVerification) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resendTwoFactorCode: (method: string) => Promise<{ success: boolean; error?: string }>;
  
  // Gestión de 2FA
  enableTwoFactor: (method: string) => Promise<{ success: boolean; secret?: string; qrCode?: string; error?: string }>;
  disableTwoFactor: (password: string) => Promise<{ success: boolean; error?: string }>;
  generateBackupCodes: () => Promise<{ success: boolean; codes?: string[]; error?: string }>;
  
  // Sesión y seguridad
  refreshSession: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getLoginHistory: () => Promise<LoginAttempt[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [pendingVerification, setPendingVerification] = useState(false);

  const twoFactorMethods: TwoFactorMethod[] = [
    {
      id: 'authenticator',
      name: 'App Autenticadora',
      type: 'authenticator',
      enabled: false,
      icon: '📱',
      description: 'Google Authenticator, Authy, etc.'
    },
    {
      id: 'sms',
      name: 'SMS',
      type: 'sms',
      enabled: false,
      icon: '💬',
      description: 'Código por mensaje de texto'
    },
    {
      id: 'email',
      name: 'Email',
      type: 'email',
      enabled: false,
      icon: '📧',
      description: 'Código por correo electrónico'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      type: 'whatsapp',
      enabled: false,
      icon: '💚',
      description: 'Código por WhatsApp'
    }
  ];

  const isAuthenticated = !!(user && session?.isVerified);

  // Usuarios de demo
  const demoUsers: User[] = [
    {
      id: 'demo-admin',
      email: 'admin@fumigacion.mx',
      name: 'Administrador Demo',
      phone: '+52 55 1234 5678',
      role: 'admin',
      twoFactorEnabled: true,
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date()
    },
    {
      id: 'demo-user',
      email: 'usuario@fumigacion.mx',
      name: 'Usuario Demo',
      phone: '+52 55 8765 4321',
      role: 'user',
      twoFactorEnabled: false,
      createdAt: new Date('2024-01-15')
    }
  ];

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; requiresTwoFactor?: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Simular validación de credenciales
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const foundUser = demoUsers.find(u => u.email === credentials.email);
      
      // Para la demo, cualquier contraseña funciona excepto "wrong"
      if (!foundUser || credentials.password === 'wrong') {
        const failedAttempt: LoginAttempt = {
          email: credentials.email,
          timestamp: new Date(),
          success: false,
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent
        };
        
        setLoginAttempts(prev => [failedAttempt, ...prev]);
        
        return {
          success: false,
          error: 'Credenciales incorrectas'
        };
      }

      // Crear sesión temporal
      const tempSession: AuthSession = {
        userId: foundUser.id,
        token: `temp_${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
        isVerified: !foundUser.twoFactorEnabled,
        requiresTwoFactor: foundUser.twoFactorEnabled
      };

      setSession(tempSession);
      setPendingVerification(foundUser.twoFactorEnabled);

      if (foundUser.twoFactorEnabled) {
        // Simular envío de código 2FA
        console.log('📱 Código 2FA enviado: 123456'); // En producción esto sería real
        
        return {
          success: true,
          requiresTwoFactor: true
        };
      } else {
        // Login directo si no tiene 2FA habilitado
        setUser(foundUser);
        
        const successAttempt: LoginAttempt = {
          email: credentials.email,
          timestamp: new Date(),
          success: true,
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent,
          twoFactorUsed: false
        };
        
        setLoginAttempts(prev => [successAttempt, ...prev]);
        
        // Guardar en localStorage
        localStorage.setItem('authUser', JSON.stringify(foundUser));
        localStorage.setItem('authSession', JSON.stringify(tempSession));
        
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (verification: TwoFactorVerification): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!pendingVerification || !session) {
        return { success: false, error: 'No hay verificación pendiente' };
      }

      // Simular verificación de código
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Para la demo, el código correcto es siempre "123456"
      if (verification.code !== '123456') {
        return { success: false, error: 'Código incorrecto' };
      }

      const foundUser = demoUsers.find(u => u.id === session.userId);
      if (!foundUser) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Actualizar sesión como verificada
      const verifiedSession: AuthSession = {
        ...session,
        isVerified: true,
        requiresTwoFactor: false
      };

      setSession(verifiedSession);
      setUser(foundUser);
      setPendingVerification(false);

      const successAttempt: LoginAttempt = {
        email: foundUser.email,
        timestamp: new Date(),
        success: true,
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent,
        twoFactorUsed: true
      };

      setLoginAttempts(prev => [successAttempt, ...prev]);

      // Guardar en localStorage
      localStorage.setItem('authUser', JSON.stringify(foundUser));
      localStorage.setItem('authSession', JSON.stringify(verifiedSession));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al verificar código' };
    }
  };

  const resendTwoFactorCode = async (method: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`📱 Código reenviado por ${method}: 123456`);
    return { success: true };
  };

  const enableTwoFactor = async (method: string): Promise<{ success: boolean; secret?: string; qrCode?: string; error?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (method === 'authenticator') {
        const secret = 'JBSWY3DPEHPK3PXP'; // Secret de ejemplo
        const qrCode = `otpauth://totp/Fumigacion:${user?.email}?secret=${secret}&issuer=Fumigacion`;
        
        return {
          success: true,
          secret,
          qrCode
        };
      }
      
      // Actualizar usuario
      if (user) {
        const updatedUser = { ...user, twoFactorEnabled: true };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al habilitar 2FA' };
    }
  };

  const disableTwoFactor = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password === 'wrong') {
        return { success: false, error: 'Contraseña incorrecta' };
      }
      
      if (user) {
        const updatedUser = { ...user, twoFactorEnabled: false };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al deshabilitar 2FA' };
    }
  };

  const generateBackupCodes = async (): Promise<{ success: boolean; codes?: string[]; error?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      
      return { success: true, codes };
    } catch (error) {
      return { success: false, error: 'Error al generar códigos' };
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setSession(null);
    setPendingVerification(false);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authSession');
  };

  const refreshSession = async (): Promise<void> => {
    const storedUser = localStorage.getItem('authUser');
    const storedSession = localStorage.getItem('authSession');
    
    if (storedUser && storedSession) {
      try {
        const userData = JSON.parse(storedUser);
        const sessionData = JSON.parse(storedSession);
        
        // Verificar si la sesión no ha expirado
        if (new Date(sessionData.expiresAt) > new Date()) {
          setUser(userData);
          setSession(sessionData);
        } else {
          await logout();
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        await logout();
      }
    }
    
    setIsLoading(false);
  };

  const changePassword = async (currentPassword: string, _newPassword: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (currentPassword === 'wrong') {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }
    
    return { success: true };
  };

  const getLoginHistory = async (): Promise<LoginAttempt[]> => {
    return loginAttempts;
  };

  // Inicializar sesión al cargar
  useEffect(() => {
    const initSession = async () => {
      const storedUser = localStorage.getItem('authUser');
      const storedSession = localStorage.getItem('authSession');
      
      if (storedUser && storedSession) {
        try {
          const userData = JSON.parse(storedUser);
          const sessionData = JSON.parse(storedSession);
          
          // Verificar si la sesión no ha expirado
          if (new Date(sessionData.expiresAt) > new Date()) {
            setUser(userData);
            setSession(sessionData);
          } else {
            await logout();
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          await logout();
        }
      }
      
      setIsLoading(false);
    };

    initSession();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    loginAttempts,
    twoFactorMethods,
    pendingVerification,
    login,
    verifyTwoFactor,
    logout,
    resendTwoFactorCode,
    enableTwoFactor,
    disableTwoFactor,
    generateBackupCodes,
    refreshSession,
    changePassword,
    getLoginHistory
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
