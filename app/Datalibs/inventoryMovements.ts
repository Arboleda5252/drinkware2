import { sql } from "@/app/Datalibs/database";

let tableReady = false;

export type StockMovementType = "entrada" | "salida";

export async function ensureInventoryMovementTable() {
  if (tableReady) return;

  await sql(`
    CREATE TABLE IF NOT EXISTS public.inventario_movimiento (
      id_movimiento SERIAL PRIMARY KEY,
      id_producto INTEGER NOT NULL REFERENCES public.producto(idproducto) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      stock_anterior INTEGER NOT NULL,
      stock_nuevo INTEGER NOT NULL,
      referencia TEXT NULL,
      responsable TEXT NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_inventario_movimiento_creado_en
    ON public.inventario_movimiento(creado_en DESC);
  `);

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_inventario_movimiento_producto
    ON public.inventario_movimiento(id_producto);
  `);

  tableReady = true;
}

export async function logStockMovement({
  productoId,
  stockAnterior,
  stockNuevo,
  referencia,
  responsable,
}: {
  productoId: number;
  stockAnterior: number;
  stockNuevo: number;
  referencia?: string | null;
  responsable?: string | null;
}) {
  const delta = stockNuevo - stockAnterior;
  if (delta === 0) return;

  await ensureInventoryMovementTable();

  await sql(
    `
      INSERT INTO public.inventario_movimiento
        (id_producto, tipo, cantidad, stock_anterior, stock_nuevo, referencia, responsable)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `,
    [
      productoId,
      delta > 0 ? "entrada" : "salida",
      Math.abs(delta),
      stockAnterior,
      stockNuevo,
      referencia ?? null,
      responsable ?? null,
    ]
  );
}
