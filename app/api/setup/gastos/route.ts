import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

/**
 * GET - Ejecutar migraciones para crear tablas de gastos
 * POST - Agregar nuevo gasto operacional
 */

export async function GET() {
  try {
    // Agregar columna costo a tabla producto si no existe
    await sql(`
      ALTER TABLE public.producto
      ADD COLUMN IF NOT EXISTS costo NUMERIC(12, 2) DEFAULT NULL;
    `);

    // Crear tabla gastos_operacionales
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

    // Crear índices
    await sql(`
      CREATE INDEX IF NOT EXISTS idx_gastos_trimestre_año 
      ON public.gastos_operacionales(trimestre, año);
    `);

    await sql(`
      CREATE INDEX IF NOT EXISTS idx_gastos_estado 
      ON public.gastos_operacionales(estado);
    `);

    return NextResponse.json({ ok: true, message: "Migraciones ejecutadas correctamente" });
  } catch (error) {
    console.error("Error en migración:", error);
    return NextResponse.json(
      { ok: false, error: "Error al ejecutar migraciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trimestre, año, concepto, descripcion, monto, estado, fecha_pago } = body;

    // Validación
    if (!trimestre || !año || !concepto || !monto) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos: trimestre, año, concepto, monto" },
        { status: 400 }
      );
    }

    if (trimestre < 1 || trimestre > 4 || año < 2000) {
      return NextResponse.json(
        { ok: false, error: "Trimestre inválido (1-4) o año inválido" },
        { status: 400 }
      );
    }

    if (![null, "pagado", "pendiente"].includes(estado)) {
      return NextResponse.json(
        { ok: false, error: "Estado debe ser 'pagado' o 'pendiente'" },
        { status: 400 }
      );
    }

    const { rows } = await sql<{ id: number }>(`
      INSERT INTO public.gastos_operacionales 
      (trimestre, año, concepto, descripcion, monto, estado, fecha_pago)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (trimestre, año, concepto, estado) 
      DO UPDATE SET 
        monto = EXCLUDED.monto,
        descripcion = EXCLUDED.descripcion,
        fecha_pago = EXCLUDED.fecha_pago,
        fecha_actualizacion = CURRENT_TIMESTAMP
      RETURNING id;
    `, [trimestre, año, concepto, descripcion || null, monto, estado || "pendiente", fecha_pago || null]);

    return NextResponse.json({ ok: true, data: { id: rows[0]?.id } }, { status: 201 });
  } catch (error) {
    console.error("Error al agregar gasto:", error);
    return NextResponse.json(
      { ok: false, error: "Error al agregar gasto operacional" },
      { status: 500 }
    );
  }
}
