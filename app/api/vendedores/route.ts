import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type VendedorRow = {
  id: number;
  estado: string | null;
  fechaIngreso: Date | null;
};

const vendedorSelectFragment = `
  SELECT
    idvendedor AS id,
    estado,
    fechaingreso AS "fechaIngreso"
  FROM public.vendedor
`;

const toVendedorDto = (row: VendedorRow) => ({
  id: row.id,
  estado: row.estado,
  fechaIngreso: row.fechaIngreso?.toISOString() ?? null,
});

export async function GET() {
  try {
    const { rows } = await sql<VendedorRow>(`${vendedorSelectFragment} ORDER BY idvendedor ASC;`);
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
    const estado =
      typeof body?.estado === "string" && body.estado.trim() ? body.estado.trim() : "Activo";
    const fechaIngresoInput =
      typeof body?.fechaIngreso === "string" && body.fechaIngreso.trim()
        ? new Date(body.fechaIngreso)
        : null;

    if (fechaIngresoInput && Number.isNaN(fechaIngresoInput.getTime())) {
      return NextResponse.json(
        { ok: false, error: "fechaIngreso no es una fecha válida" },
        { status: 400 }
      );
    }

    const fechaIngreso = fechaIngresoInput ?? new Date();

    const { rows } = await sql<VendedorRow>(
      `
        INSERT INTO public.vendedor (estado, fechaingreso)
        VALUES ($1, $2)
        RETURNING
          idvendedor AS id,
          estado,
          fechaingreso AS "fechaIngreso";
      `,
      [estado, fechaIngreso]
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