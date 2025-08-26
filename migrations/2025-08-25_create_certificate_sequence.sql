-- Crear tabla para manejar la secuencia de folios de certificados
-- Inicia desde el folio 10100

CREATE TABLE IF NOT EXISTS certificate_sequence (
    id SERIAL PRIMARY KEY,
    next_folio INTEGER NOT NULL DEFAULT 10100,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar el valor inicial si no existe
INSERT INTO certificate_sequence (next_folio) 
SELECT 10100 
WHERE NOT EXISTS (SELECT 1 FROM certificate_sequence);

-- Agregar columna folio a la tabla de certificados si no existe
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS folio INTEGER UNIQUE;

-- Función para obtener el siguiente folio de forma atómica
CREATE OR REPLACE FUNCTION get_next_certificate_folio() 
RETURNS INTEGER AS $$
DECLARE
    next_folio_num INTEGER;
BEGIN
    -- Obtener y actualizar el siguiente folio de forma atómica
    UPDATE certificate_sequence 
    SET next_folio = next_folio + 1,
        updated_at = NOW()
    RETURNING next_folio - 1 INTO next_folio_num;
    
    -- Si no hay registros, inicializar
    IF next_folio_num IS NULL THEN
        INSERT INTO certificate_sequence (next_folio) VALUES (10101);
        next_folio_num := 10100;
    END IF;
    
    RETURN next_folio_num;
END;
$$ LANGUAGE plpgsql;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_certificates_folio ON certificates(folio);

-- Comentarios para documentación
COMMENT ON TABLE certificate_sequence IS 'Tabla para manejar la secuencia consecutiva de folios de certificados';
COMMENT ON FUNCTION get_next_certificate_folio() IS 'Función que retorna el siguiente folio disponible de forma thread-safe';
