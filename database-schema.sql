-- Esquema simplificado solo para usuarios
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'operator')),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  settings JSONB DEFAULT '{"emailNotifications": true, "smsNotifications": false, "autoSave": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de accesos (opcional, para seguridad)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  two_factor_used BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla simple para tracking de uso de certificados (opcional)
CREATE TABLE certificate_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  folio VARCHAR(100) NOT NULL,
  placas VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices básicos
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios de prueba
INSERT INTO users (email, name, password_hash, role, phone, department) VALUES 
-- Contraseña: admin123
('admin@zaro.com', 'Administrador Zaro', '$2a$10$rZaF7YGVcKzGFJq8Q2RHO.WX3zQvQK1qYmQ8kH6LXpJ4vB3nR2T8m', 'admin', '+52 555 000 0001', 'Administración'),
-- Contraseña: user123  
('user@zaro.com', 'Usuario Demo', '$2a$10$rZaF7YGVcKzGFJq8Q2RHO.WX3zQvQK1qYmQ8kH6LXpJ4vB3nR2T8m', 'user', '+52 555 123 4567', 'Operaciones'),
-- Contraseña: operator123
('operator@zaro.com', 'Operador Demo', '$2a$10$rZaF7YGVcKzGFJq8Q2RHO.WX3zQvQK1qYmQ8kH6LXpJ4vB3nR2T8m', 'operator', '+52 555 987 6543', 'Logística');
