import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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
  const { id: routeId } = await params;
  const id = Number(routeId);

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

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates: string[] = [];
    const values: Array<number | string | null> = [];

    const addUpdate = (column: string, value: number | string | null) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (body?.subtotal !== undefined) {
      const subtotal = Number(body.subtotal);
      if (!Number.isFinite(subtotal) || subtotal < 0) {
        return NextResponse.json(
          { ok: false, error: "subtotal debe ser un numero valido" },
          { status: 400 }
        );
      }
      addUpdate("subtotal", subtotal);
    }

    if (body?.costoEnvio !== undefined || body?.costo_envio !== undefined) {
      const costoEnvio = Number(body?.costoEnvio ?? body?.costo_envio);
      if (!Number.isFinite(costoEnvio) || costoEnvio < 0) {
        return NextResponse.json(
          { ok: false, error: "costo_envio debe ser un numero valido" },
          { status: 400 }
        );
      }
      addUpdate("costo_envio", costoEnvio);
    }

    if (body?.tipoEntrega !== undefined || body?.tipo_entrega !== undefined) {
      const tipoEntrega = body?.tipoEntrega ?? body?.tipo_entrega;
      if (tipoEntrega === null || tipoEntrega === "") {
        addUpdate("tipo_entrega", null);
      } else if (typeof tipoEntrega === "string") {
        addUpdate("tipo_entrega", tipoEntrega.trim());
      }
    }

    if (body?.estadoPedido !== undefined || body?.estado_pedido !== undefined) {
      const estadoPedido = body?.estadoPedido ?? body?.estado_pedido;
      if (estadoPedido === null || estadoPedido === "") {
        addUpdate("estado_pedido", null);
      } else if (typeof estadoPedido === "string") {
        addUpdate("estado_pedido", estadoPedido.trim());
      }
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No hay campos validos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);
    const index = values.length;

    const { rows } = await sql<PedidoRow>(
      `
        UPDATE public.pedido
        SET
          ${updates.join(", ")},
          total = (subtotal + costo_envio)::numeric(12,2)
        WHERE id_pedido = $${index}
        RETURNING
          id_pedido AS "idPedido",
          id_cliente AS "idCliente",
          id_vendedor AS "idVendedor",
          fecha_creacion AS "fechaCreacion",
          tipo_entrega AS "tipoEntrega",
          estado_pedido AS "estadoPedido",
          observacion,
          subtotal,
          costo_envio AS "costoEnvio",
          total;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/pedidos/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el pedido" },
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
    const { rows } = await sql<{ idPedido: number }>(
      `
        DELETE FROM public.pedido
        WHERE id_pedido = $1
        RETURNING id_pedido AS "idPedido";
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[DELETE /api/pedidos/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el pedido" },
      { status: 500 }
    );
  }
}
