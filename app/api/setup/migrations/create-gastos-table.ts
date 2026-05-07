import { sql } from "@/app/Datalibs/database";

/**
 * Script de migración para crear tabla de gastos operacionales
 * Ejecutar una sola vez en la BD
 */
export async function createGastosTable() {
  try {
    // 1. Agregar columna costo a tabla producto si no existe
    await sql(`
      ALTER TABLE public.producto
      ADD COLUMN IF NOT EXISTS costo NUMERIC(12, 2) DEFAULT NULL;
    `);
    console.log("✓ Campo costo agregado a tabla producto");

    // 2. Crear tabla gastos_operacionales
    await sql(`
      CREATE TABLE IF NOT EXISTS public.gastos_operacionales (
        id SERIAL PRIMARY KEY,
        trimestre INTEGER NOT NULL CHECK (trimestre >= 1 AND trimestre <= 4),
        año INTEGER NOT NULL,
        concepto VARCHAR(255) NOT NULL,
        descripcion TEXT,
        monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
        estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente')),
        fecha_pago DATE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_gasto_trimestre UNIQUE (trimestre, año, concepto, estado)
      );
    `);
    console.log("✓ Tabla gastos_operacionales creada");

    // 3. Crear índices para optimizar consultas
    await sql(`
      CREATE INDEX IF NOT EXISTS idx_gastos_trimestre_año 
      ON public.gastos_operacionales(trimestre, año);
    `);
    
    await sql(`
      CREATE INDEX IF NOT EXISTS idx_gastos_estado 
      ON public.gastos_operacionales(estado);
    `);
    
    console.log("✓ Índices creados");
    
    return { ok: true, message: "Migraciones ejecutadas correctamente" };
  } catch (error) {
    console.error("Error en migración:", error);
    throw error;
  }
}
