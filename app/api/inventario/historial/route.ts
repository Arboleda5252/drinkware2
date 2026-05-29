import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { ensureInventoryMovementTable } from "@/app/Datalibs/inventoryMovements";

export const runtime = "nodejs";

type MovimientoRow = {
  id: number;
  productoId: number;
  productoNombre: string;
  tipo: "entrada" | "salida";
  cantidad: number | string;
  fecha: string;
  responsable: string | null;
  referencia: string | null;
  precioUnitario: number | string | null;
  subtotal: number | string | null;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDias(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("dias");
  const parsed = Number(raw ?? 30);

  if (!Number.isInteger(parsed) || parsed <= 0) return 30;
  return Math.min(parsed, 365);
}

export async function GET(req: NextRequest) {
  const dias = getDias(req);

  try {
    await ensureInventoryMovementTable();

    const { rows } = await sql<MovimientoRow>(
      `
        SELECT
          m.id_movimiento AS id,
          m.id_producto AS "productoId",
          p.nombre AS "productoNombre",
          m.tipo,
          m.cantidad,
          m.creado_en AS fecha,
          m.responsable,
          m.referencia,
          p.precio_cliente::double precision AS "precioUnitario",
          (m.cantidad * p.precio_cliente)::double precision AS subtotal
        FROM public.inventario_movimiento AS m
        INNER JOIN public.producto AS p ON p.idproducto = m.id_producto
        WHERE m.creado_en >= NOW() - ($1::int * INTERVAL '1 day')
        ORDER BY m.creado_en DESC, m.id_movimiento DESC;
      `,
      [dias]
    );

    const movimientos = rows.map((row) => ({
      id: Number(row.id),
      producto_id: Number(row.productoId),
      producto_nombre: row.productoNombre,
      tipo: row.tipo,
      cantidad: toNumber(row.cantidad),
      fecha: row.fecha,
      responsable: row.responsable,
      referencia: row.referencia,
      precio_unitario: row.precioUnitario === null ? null : toNumber(row.precioUnitario),
      subtotal: row.subtotal === null ? null : toNumber(row.subtotal),
    }));

    const totalEntradas = movimientos
      .filter((movimiento) => movimiento.tipo === "entrada")
      .reduce((total, movimiento) => total + movimiento.cantidad, 0);
    const totalSalidas = movimientos
      .filter((movimiento) => movimiento.tipo === "salida")
      .reduce((total, movimiento) => total + movimiento.cantidad, 0);

    return NextResponse.json({
      ok: true,
      data: {
        movimientos,
        resumen: {
          totalEntradas,
          totalSalidas,
          saldo: totalEntradas - totalSalidas,
          periodo: `${dias} dias`,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/inventario/historial]", error);
    return NextResponse.json(
      { ok: false, error: "Error al consultar historial de inventario" },
      { status: 500 }
    );
  }
}
