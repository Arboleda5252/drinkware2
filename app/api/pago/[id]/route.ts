import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type PagoRow = {
  idPago: number;
  idPedido: number;
  metodoPago: string;
  estadoPago: string;
  monto: number | string;
  fechaPago: string | null;
  referenciaPago: string | null;
  observacion: string | null;
};

const selectById = `
  SELECT
    id_pago AS "idPago",
    id_pedido AS "idPedido",
    metodo_pago AS "metodoPago",
    estado_pago AS "estadoPago",
    monto,
    fecha_pago AS "fechaPago",
    referencia_pago AS "referenciaPago",
    observacion
  FROM public.pago
  WHERE id_pago = $1;
`;

const toDto = (row: PagoRow) => ({
  idPago: Number(row.idPago),
  idPedido: Number(row.idPedido),
  metodoPago: row.metodoPago,
  estadoPago: row.estadoPago,
  monto: Number(row.monto),
  fechaPago: row.fechaPago,
  referenciaPago: row.referenciaPago,
  observacion: row.observacion,
});

const textOrNull = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parseDateOrNull = (value: unknown, field: string) => {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (value === null || value === "") return { ok: true as const, value: null as string | null };
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: `${field} debe ser una fecha valida o null` },
        { status: 400 }
      ),
    };
  }
  return { ok: true as const, value };
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<PagoRow>(selectById, [id]);
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/pago/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener el pago" },
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

  const body = await req.json().catch(() => ({}));
  const updates: string[] = [];
  const values: Array<number | string | null> = [];

  const addUpdate = (column: string, value: number | string | null) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if (body?.idPedido !== undefined || body?.id_pedido !== undefined) {
    const idPedido = Number(body?.idPedido ?? body?.id_pedido);
    if (!Number.isInteger(idPedido) || idPedido <= 0) {
      return NextResponse.json(
        { ok: false, error: "id_pedido debe ser un entero positivo" },
        { status: 400 }
      );
    }
    addUpdate("id_pedido", idPedido);
  }

  if (body?.metodoPago !== undefined || body?.metodo_pago !== undefined) {
    const metodoPago = textOrNull(body?.metodoPago ?? body?.metodo_pago);
    if (!metodoPago) {
      return NextResponse.json(
        { ok: false, error: "metodo_pago debe ser un texto no vacio" },
        { status: 400 }
      );
    }
    addUpdate("metodo_pago", metodoPago);
  }

  if (body?.estadoPago !== undefined || body?.estado_pago !== undefined) {
    const estadoPago = textOrNull(body?.estadoPago ?? body?.estado_pago);
    if (!estadoPago) {
      return NextResponse.json(
        { ok: false, error: "estado_pago debe ser un texto no vacio" },
        { status: 400 }
      );
    }
    addUpdate("estado_pago", estadoPago);
  }

  if (body?.monto !== undefined) {
    const monto = Number(body.monto);
    if (!Number.isFinite(monto) || monto < 0) {
      return NextResponse.json(
        { ok: false, error: "monto debe ser un numero valido" },
        { status: 400 }
      );
    }
    addUpdate("monto", monto);
  }

  const fechaPagoResult = parseDateOrNull(body?.fechaPago ?? body?.fecha_pago, "fecha_pago");
  if (!fechaPagoResult.ok) {
    return fechaPagoResult.response;
  }
  if (fechaPagoResult.value !== undefined) {
    addUpdate("fecha_pago", fechaPagoResult.value);
  }

  if (body?.referenciaPago !== undefined || body?.referencia_pago !== undefined) {
    addUpdate("referencia_pago", textOrNull(body?.referenciaPago ?? body?.referencia_pago));
  }

  if (body?.observacion !== undefined) {
    addUpdate("observacion", textOrNull(body?.observacion));
  }

  if (!updates.length) {
    return NextResponse.json(
      { ok: false, error: "No hay campos validos para actualizar" },
      { status: 400 }
    );
  }

  values.push(id);
  const index = values.length;

  try {
    const { rows } = await sql<PagoRow>(
      `
        UPDATE public.pago
        SET ${updates.join(", ")}
        WHERE id_pago = $${index}
        RETURNING
          id_pago AS "idPago",
          id_pedido AS "idPedido",
          metodo_pago AS "metodoPago",
          estado_pago AS "estadoPago",
          monto,
          fecha_pago AS "fechaPago",
          referencia_pago AS "referenciaPago",
          observacion;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/pago/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el pago" },
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
    const { rows } = await sql<{ idPago: number }>(
      `
        DELETE FROM public.pago
        WHERE id_pago = $1
        RETURNING id_pago AS "idPago";
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[DELETE /api/pago/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el pago" },
      { status: 500 }
    );
  }
}
