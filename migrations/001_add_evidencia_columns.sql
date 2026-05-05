-- Script para agregar columnas de evidencia a la tabla entrega
-- Ejecutar en la base de datos PostgreSQL

-- Agregar columna para foto de evidencia (en Base64)
ALTER TABLE public.entrega
ADD COLUMN IF NOT EXISTS foto_evidencia TEXT NULL COMMENT 'Foto de evidencia de la entrega en formato Base64';

-- Si usas PostgreSQL (sin COMMENT)
COMMENT ON COLUMN public.entrega.foto_evidencia IS 'Foto de evidencia de la entrega en formato Base64';

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_entrega_domiciliario_estado 
ON public.entrega(id_domiciliario, estado_entrega);

CREATE INDEX IF NOT EXISTS idx_entrega_fecha_entrega 
ON public.entrega(fecha_entrega DESC);

-- Verificar que las columnas se crearon correctamente
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'entrega'
-- ORDER BY ordinal_position;
