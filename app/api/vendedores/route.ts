import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type VendedorRow = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  documento: string | null;
  estado: boolean | null;
  fechaIngreso: Date | null;
};

const vendedorSelectFragment = `
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
`;

const toVendedorDto = (row: VendedorRow) => ({
  id: row.id,
  nombre: row.nombre,
  apellido: row.apellido,
  correo: row.correo,
  documento: row.documento,
  estado: Boolean(row.estado),
  fechaIngreso: row.fechaIngreso?.toISOString() ?? null,
});

export async function GET() {
  try {
    const { rows } = await sql<VendedorRow>(`${vendedorSelectFragment} ORDER BY v.idvendedor ASC;`);
    return NextResponse.json({ ok: true, data: rows.map(toVendedorDto) });
  } catch (error) {
    console.error("[GET /api/vendedores]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar vendedores" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idVendedor = Number(body?.id ?? body?.idVendedor ?? body?.idvendedor ?? body?.id_usuario);
    if (!Number.isInteger(idVendedor) || idVendedor <= 0) {
      return NextResponse.json(
        { ok: false, error: "idVendedor debe ser un entero positivo" },
        { status: 400 }
      );
    }

    const estado =
      typeof body?.estado === "boolean"
        ? body.estado
        : typeof body?.estado === "string"
          ? body.estado.trim().toLowerCase() === "true"
          : true;

    const fechaIngresoInput =
      typeof body?.fechaIngreso === "string" && body.fechaIngreso.trim()
        ? new Date(body.fechaIngreso)
        : null;

    if (fechaIngresoInput && Number.isNaN(fechaIngresoInput.getTime())) {
      return NextResponse.json(
        { ok: false, error: "fechaIngreso no es una fecha valida" },
        { status: 400 }
      );
    }

    const fechaIngreso = fechaIngresoInput ?? new Date();

    await sql(
      `
        INSERT INTO public.vendedor (idvendedor, estado, fechaingreso)
        VALUES ($1, $2, $3)
        ON CONFLICT (idvendedor) DO NOTHING;
      `,
      [idVendedor, estado, fechaIngreso]
    );

    const { rows } = await sql<VendedorRow>(
      `${vendedorSelectFragment} WHERE v.idvendedor = $1 LIMIT 1;`,
      [idVendedor]
    );

    return NextResponse.json({ ok: true, data: toVendedorDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/vendedores]", error);
    return NextResponse.json(
      { ok: false, error: "Error al crear vendedor" },
      { status: 500 }
    );
  }
}
