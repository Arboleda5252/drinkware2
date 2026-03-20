import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type PedidoProveedorRow = {
  id: number;
  productoId: number | null;
  cantidad: number;
  estado: string | null;
  descripcion: string | null;
  creadoEn: Date | null;
};

const toDto = (row: PedidoProveedorRow) => ({
  id: row.id,
  productoId: row.productoId,
  cantidad: row.cantidad,
  estado: row.estado,
  descripcion: row.descripcion,
  creadoEn: row.creadoEn?.toISOString() ?? null,
});

const selectById = `
  SELECT
    id,
    producto_id AS "productoId",
    cantidad,
    estado,
    descripcion,
    creado_en AS "creadoEn"
  FROM public.pedidosproveedor
  WHERE id = $1;
`;

// GET
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<PedidoProveedorRow>(selectById, [id]);
    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Pedido a proveedor no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/pedidosproveedor/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener pedido a proveedor" },
      { status: 500 }
    );
  }
}

// PUT
export async function PUT(req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const updates: string[] = [];
  const values: any[] = [];
  let index = 1;

  const addUpdate = (column: string, value: any) => {
    updates.push(`${column} = $${index++}`);
    values.push(value);
  };

  if (body?.productoId !== undefined) {
    if (!Number.isInteger(body.productoId)) {
      return NextResponse.json(
        { ok: false, error: "productoId debe ser un entero válido" },
        { status: 400 }
      );
    }
    addUpdate("producto_id", body.productoId);
  }

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

  if (body?.estado !== undefined) {
    if (typeof body.estado !== "string" || !body.estado.trim()) {
      return NextResponse.json(
        { ok: false, error: "estado debe ser un texto no vacío" },
        { status: 400 }
      );
    }
    addUpdate("estado", body.estado.trim());
  }

  if (body?.descripcion !== undefined) {
    if (body.descripcion !== null && typeof body.descripcion !== "string") {
      return NextResponse.json(
        { ok: false, error: "descripcion debe ser texto o null" },
        { status: 400 }
      );
    }
    addUpdate("descripcion", body.descripcion);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay campos válidos para actualizar" },
      { status: 400 }
    );
  }

  values.push(id);

  try {
    const { rows } = await sql<PedidoProveedorRow>(
      `
        UPDATE public.pedidosproveedor
        SET ${updates.join(", ")}
        WHERE id = $${index}
        RETURNING
          id,
          producto_id AS "productoId",
          cantidad,
          estado,
          descripcion,
          creado_en AS "creadoEn";
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Pedido a proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/pedidosproveedor/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar pedido a proveedor" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<{ id: number }>(
      `
        DELETE FROM public.pedidosproveedor
        WHERE id = $1
        RETURNING id;
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Pedido a proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[DELETE /api/pedidosproveedor/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar pedido a proveedor" },
      { status: 500 }
    );
  }
}
