import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: { id: string } };

type DetallePedidoRow = {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number | string;
  subtotal: number | string | null;
};

const selectById = `
  SELECT
    id_detalle_pedido AS "idDetallePedido",
    id_pedido AS "idPedido",
    id_producto AS "idProducto",
    cantidad,
    precio_unitario AS "precioUnitario",
    subtotal
  FROM public.detalle_pedido
  WHERE id_detalle_pedido = $1;
`;

const toDto = (row: DetallePedidoRow) => ({
  idDetallePedido: Number(row.idDetallePedido),
  idPedido: Number(row.idPedido),
  idProducto: Number(row.idProducto),
  cantidad: Number(row.cantidad),
  precioUnitario: Number(row.precioUnitario),
  subtotal: row.subtotal === null ? null : Number(row.subtotal),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<DetallePedidoRow>(selectById, [id]);

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Detalle de pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/detalle_pedido/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener el detalle de pedido" },
      { status: 500 }
    );
  }
}