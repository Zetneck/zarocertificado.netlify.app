export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user' | 'operator';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
  isVerified: boolean;
  requiresTwoFactor: boolean;
}

export interface TwoFactorMethod {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'authenticator' | 'whatsapp';
  enabled: boolean;
  icon: string;
  description: string;
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  twoFactorUsed?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TwoFactorVerification {
  code: string;
  method: string;
}
