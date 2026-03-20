import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: { id: string } };

type PedidoRow = {
  idPedido: number;
  idCliente: number | null;
  idVendedor: number | null;
  fechaCreacion: string;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  observacion: string | null;
  subtotal: number | string;
  costoEnvio: number | string;
  total: number | string;
};

const selectById = `
  SELECT
    id_pedido AS "idPedido",
    id_cliente AS "idCliente",
    id_vendedor AS "idVendedor",
    fecha_creacion AS "fechaCreacion",
    tipo_entrega AS "tipoEntrega",
    estado_pedido AS "estadoPedido",
    observacion,
    subtotal,
    costo_envio AS "costoEnvio",
    total
  FROM public.pedido
  WHERE id_pedido = $1;
`;

const toDto = (row: PedidoRow) => ({
  idPedido: Number(row.idPedido),
  idCliente: row.idCliente === null ? null : Number(row.idCliente),
  idVendedor: row.idVendedor === null ? null : Number(row.idVendedor),
  fechaCreacion: row.fechaCreacion,
  tipoEntrega: row.tipoEntrega,
  estadoPedido: row.estadoPedido,
  observacion: row.observacion,
  subtotal: Number(row.subtotal),
  costoEnvio: Number(row.costoEnvio),
  total: Number(row.total),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<PedidoRow>(selectById, [id]);

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/pedidos/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener el pedido" },
      { status: 500 }
    );
  }
}
