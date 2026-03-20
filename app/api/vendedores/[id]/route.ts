import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type VendedorRow = {
  id: number;
  estado: string | null;
  fechaIngreso: Date | null;
};

const toVendedorDto = (row: VendedorRow) => ({
  id: row.id,
  estado: row.estado,
  fechaIngreso: row.fechaIngreso?.toISOString() ?? null,
});

const selectById = `
  SELECT
    idvendedor AS id,
    estado,
    fechaingreso AS "fechaIngreso"
  FROM public.vendedor
  WHERE idvendedor = $1;
`;

// GET
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<VendedorRow>(selectById, [id]);
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Vendedor no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: toVendedorDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/vendedores/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener vendedor" },
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

  if (body?.estado !== undefined) {
    if (typeof body.estado !== "string" || !body.estado.trim()) {
      return NextResponse.json(
        { ok: false, error: "estado debe ser un texto no vacío" },
        { status: 400 }
      );
    }
    updates.push(`estado = $${index++}`);
    values.push(body.estado.trim());
  }

  if (body?.fechaIngreso !== undefined) {
    const fecha = new Date(body.fechaIngreso);
    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json(
        { ok: false, error: "fechaIngreso no es una fecha válida" },
        { status: 400 }
      );
    }
    updates.push(`fechaingreso = $${index++}`);
    values.push(fecha);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay campos válidos para actualizar" },
      { status: 400 }
    );
  }

  values.push(id);

  try {
    const { rows } = await sql<VendedorRow>(
      `
        UPDATE public.vendedor
        SET ${updates.join(", ")}
        WHERE idvendedor = $${index}
        RETURNING
          idvendedor AS id,
          estado,
          fechaingreso AS "fechaIngreso";
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Vendedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toVendedorDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/vendedores/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar vendedor" },
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
        DELETE FROM public.vendedor
        WHERE idvendedor = $1
        RETURNING idvendedor AS id;
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Vendedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[DELETE /api/vendedores/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar vendedor" },
      { status: 500 }
    );
  }
}
