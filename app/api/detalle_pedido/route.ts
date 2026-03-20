import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

type DetallePedidoRow = {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number | string;
  subtotal: number | string | null;
};

const baseSelect = `
  SELECT
    id_detalle_pedido AS "idDetallePedido",
    id_pedido AS "idPedido",
    id_producto AS "idProducto",
    cantidad,
    precio_unitario AS "precioUnitario",
    subtotal
  FROM public.detalle_pedido
`;

const toDto = (row: DetallePedidoRow) => ({
  idDetallePedido: Number(row.idDetallePedido),
  idPedido: Number(row.idPedido),
  idProducto: Number(row.idProducto),
  cantidad: Number(row.cantidad),
  precioUnitario: Number(row.precioUnitario),
  subtotal: row.subtotal === null ? null : Number(row.subtotal),
});

export async function GET() {
  try {
    const { rows } = await sql<DetallePedidoRow>(
      `${baseSelect} ORDER BY id_detalle_pedido DESC;`
    );

    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/detalle_pedido]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar detalle_pedido" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const idPedido = Number(body?.idPedido ?? body?.id_pedido);
    const idProducto = Number(body?.idProducto ?? body?.id_producto);
    const cantidad = Number(body?.cantidad);
    const precioUnitario = Number(body?.precioUnitario ?? body?.precio_unitario ?? body?.precio);

    if (!Number.isInteger(idPedido) || idPedido <= 0) {
      return NextResponse.json(
        { ok: false, error: "id_pedido debe ser un entero positivo" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      return NextResponse.json(
        { ok: false, error: "id_producto debe ser un entero positivo" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return NextResponse.json(
        { ok: false, error: "cantidad debe ser un entero positivo" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      return NextResponse.json(
        { ok: false, error: "precio_unitario debe ser un numero valido" },
        { status: 400 }
      );
    }

    const { rows } = await sql<DetallePedidoRow>(
      `
        INSERT INTO public.detalle_pedido
          (id_pedido, id_producto, cantidad, precio_unitario)
        VALUES (
          $1::integer,
          $2::integer,
          $3::integer,
          $4::numeric(12,2)
        )
        RETURNING
          id_detalle_pedido AS "idDetallePedido",
          id_pedido AS "idPedido",
          id_producto AS "idProducto",
          cantidad,
          precio_unitario AS "precioUnitario",
          subtotal;
      `,
      [idPedido, idProducto, cantidad, precioUnitario]
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/detalle_pedido]", error);
    const { message, status } = mapDetallePedidoError(error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapDetallePedidoError(error: unknown) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      const constraint = error.constraint ?? "";
      if (constraint.includes("id_pedido")) {
        return {
          status: 400,
          message: "El pedido asociado no existe en la base de datos",
        };
      }

      return {
        status: 400,
        message: "El producto asociado no existe en la base de datos",
      };
    }

    return {
      status: 500,
      message: error.detail ?? error.message ?? "Error en la base de datos",
    };
  }

  const code = typeof error === "object" && error && "code" in error ? (error as any).code : null;
  if (typeof code === "string" && connectionErrorCodes.has(code)) {
    return {
      status: 503,
      message: "No se pudo conectar a la base de datos. Revisa app/libs/database.ts",
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : "Error al crear detalle de pedido",
  };
}