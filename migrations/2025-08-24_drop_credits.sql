-- Quitar columna 'credits' del esquema si existe
ALTER TABLE IF EXISTS users
  DROP COLUMN IF EXISTS credits;
