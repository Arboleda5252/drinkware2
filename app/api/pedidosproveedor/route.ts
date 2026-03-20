import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type PedidoProveedorRow = {
  id: number;
  productoId: number | null;
  cantidad: number;
  estado: string | null;
  descripcion: string | null;
  creadoEn: Date | null;
};

const selectQuery = `
  SELECT
    id,
    producto_id AS "productoId",
    cantidad,
    estado,
    descripcion,
    creado_en AS "creadoEn"
  FROM public.pedidosproveedor
`;

const toDto = (row: PedidoProveedorRow) => ({
  id: row.id,
  productoId: row.productoId,
  cantidad: row.cantidad,
  estado: row.estado,
  descripcion: row.descripcion,
  creadoEn: row.creadoEn?.toISOString() ?? null,
});

// GET
export async function GET() {
  try {
    const { rows } = await sql<PedidoProveedorRow>(`${selectQuery} ORDER BY creado_en DESC;`);
    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/pedidosproveedor]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar pedidos a proveedores" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const productoId =
      body?.productoId ?? body?.producto_id ?? body?.idProducto ?? body?.id_producto ?? null;
    const cantidad = Number(body?.cantidad);
    const estado =
      typeof body?.estado === "string" && body.estado.trim() ? body.estado.trim() : "Pendiente";
    const descripcion =
      typeof body?.descripcion === "string" && body.descripcion.trim()
        ? body.descripcion.trim()
        : null;

    if (!Number.isInteger(productoId)) {
      return NextResponse.json(
        { ok: false, error: "productoId debe ser un entero válido" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return NextResponse.json(
        { ok: false, error: "cantidad debe ser un entero positivo" },
        { status: 400 }
      );
    }

    const { rows } = await sql<PedidoProveedorRow>(
      `
        INSERT INTO public.pedidosproveedor
          (producto_id, cantidad, estado, descripcion, creado_en)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING
          id,
          producto_id AS "productoId",
          cantidad,
          estado,
          descripcion,
          creado_en AS "creadoEn";
      `,
      [productoId, cantidad, estado, descripcion]
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pedidosproveedor]", error);
    return NextResponse.json(
      { ok: false, error: "Error al crear pedido a proveedor" },
      { status: 500 }
    );
  }
}