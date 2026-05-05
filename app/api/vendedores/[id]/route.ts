import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type VendedorRow = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  documento: string | null;
  estado: boolean | null;
  fechaIngreso: Date | null;
};

const toVendedorDto = (row: VendedorRow) => ({
  id: row.id,
  nombre: row.nombre,
  apellido: row.apellido,
  correo: row.correo,
  documento: row.documento,
  estado: Boolean(row.estado),
  fechaIngreso: row.fechaIngreso?.toISOString() ?? null,
});

const selectById = `
  SELECT
    v.idvendedor AS id,
    u.nombre,
    u.apellido,
    u.email AS correo,
    u.documento,
    v.estado,
    v.fechaingreso AS "fechaIngreso"
  FROM public.vendedor AS v
  LEFT JOIN public.usuario AS u ON u.idusuario = v.idvendedor
  WHERE v.idvendedor = $1;
`;

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
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

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const payload = (typeof body === "object" && body ? body : {}) as {
    estado?: boolean;
    fechaIngreso?: string;
  };

  const updates: string[] = [];
  const values: Array<boolean | Date | number> = [];
  let index = 1;

  if (payload.estado !== undefined) {
    if (typeof payload.estado !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "estado debe ser booleano" },
        { status: 400 }
      );
    }
    updates.push(`estado = $${index++}`);
    values.push(payload.estado);
  }

  if (payload.fechaIngreso !== undefined) {
    const fecha = new Date(payload.fechaIngreso);
    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json(
        { ok: false, error: "fechaIngreso no es una fecha valida" },
        { status: 400 }
      );
    }
    updates.push(`fechaingreso = $${index++}`);
    values.push(fecha);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay campos validos para actualizar" },
      { status: 400 }
    );
  }

  values.push(id);

  try {
    await sql(
      `
        UPDATE public.vendedor
        SET ${updates.join(", ")}
        WHERE idvendedor = $${index};
      `,
      values
    );

    const { rows } = await sql<VendedorRow>(selectById, [id]);
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
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
