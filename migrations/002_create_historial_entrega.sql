-- Crear tabla historial_entrega
CREATE TABLE IF NOT EXISTS public.historial_entrega (
    id_historial SERIAL PRIMARY KEY,
    id_entrega INTEGER NOT NULL REFERENCES public.entrega(id_entrega) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    comentario TEXT,
    foto_evidencia TEXT
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_entrega_id_entrega ON public.historial_entrega(id_entrega);
CREATE INDEX IF NOT EXISTS idx_historial_entrega_id_usuario ON public.historial_entrega(id_usuario);
CREATE INDEX IF NOT EXISTS idx_historial_entrega_fecha_cambio ON public.historial_entrega(fecha_cambio DESC);