import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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
  const { id: routeId } = await params;
  const id = Number(routeId);

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

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates: string[] = [];
    const values: Array<number> = [];

    const addUpdate = (column: string, value: number) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (body?.cantidad !== undefined) {
      const cantidad = Number(body.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          { ok: false, error: "cantidad debe ser un entero positivo" },
          { status: 400 }
        );
      }
      addUpdate("cantidad", cantidad);
    }

    if (body?.precioUnitario !== undefined || body?.precio_unitario !== undefined || body?.precio !== undefined) {
      const precioUnitario = Number(body?.precioUnitario ?? body?.precio_unitario ?? body?.precio);
      if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
        return NextResponse.json(
          { ok: false, error: "precio_unitario debe ser un numero valido" },
          { status: 400 }
        );
      }
      addUpdate("precio_unitario", precioUnitario);
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No hay campos validos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);
    const index = values.length;

    const { rows } = await sql<DetallePedidoRow>(
      `
        UPDATE public.detalle_pedido
        SET ${updates.join(", ")}
        WHERE id_detalle_pedido = $${index}
        RETURNING
          id_detalle_pedido AS "idDetallePedido",
          id_pedido AS "idPedido",
          id_producto AS "idProducto",
          cantidad,
          precio_unitario AS "precioUnitario",
          subtotal;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Detalle de pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/detalle_pedido/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el detalle de pedido" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<{ idDetallePedido: number }>(
      `
        DELETE FROM public.detalle_pedido
        WHERE id_detalle_pedido = $1
        RETURNING id_detalle_pedido AS "idDetallePedido";
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Detalle de pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[DELETE /api/detalle_pedido/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el detalle de pedido" },
      { status: 500 }
    );
  }
}
