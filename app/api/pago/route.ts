import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

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

const baseSelect = `
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
  if (value === undefined || value === null || value === "") {
    return { ok: true as const, value: null as string | null };
  }
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

export async function GET() {
  try {
    const { rows } = await sql<PagoRow>(`${baseSelect} ORDER BY id_pago DESC;`);
    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/pago]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar pagos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const idPedido = Number(body?.idPedido ?? body?.id_pedido);
    if (!Number.isInteger(idPedido) || idPedido <= 0) {
      return NextResponse.json(
        { ok: false, error: "id_pedido debe ser un entero positivo" },
        { status: 400 }
      );
    }

    const metodoPago = textOrNull(body?.metodoPago ?? body?.metodo_pago);
    if (!metodoPago) {
      return NextResponse.json(
        { ok: false, error: "metodo_pago es obligatorio" },
        { status: 400 }
      );
    }

    const estadoPago = textOrNull(body?.estadoPago ?? body?.estado_pago) ?? "Pendiente";

    const monto = Number(body?.monto);
    if (!Number.isFinite(monto) || monto < 0) {
      return NextResponse.json(
        { ok: false, error: "monto debe ser un numero valido" },
        { status: 400 }
      );
    }

    const fechaPagoResult = parseDateOrNull(
      body?.fechaPago ?? body?.fecha_pago,
      "fecha_pago"
    );
    if (!fechaPagoResult.ok) {
      return fechaPagoResult.response;
    }

    const referenciaPago = textOrNull(body?.referenciaPago ?? body?.referencia_pago);
    const observacion = textOrNull(body?.observacion);

    const { rows } = await sql<PagoRow>(
      `
        INSERT INTO public.pago
          (
            id_pedido,
            metodo_pago,
            estado_pago,
            monto,
            fecha_pago,
            referencia_pago,
            observacion
          )
        VALUES
          (
            $1::integer,
            $2::varchar(20),
            $3::varchar(20),
            $4::numeric(12,2),
            $5::timestamp,
            $6::varchar(100),
            $7::text
          )
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
      [idPedido, metodoPago, estadoPago, monto, fechaPagoResult.value, referenciaPago, observacion]
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pago]", error);
    const { message, status } = mapPagoError(error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapPagoError(error: unknown) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      return {
        status: 400,
        message: "El pedido asociado no existe en la base de datos",
      };
    }

    return {
      status: 500,
      message: error.detail ?? error.message ?? "Error en la base de datos",
    };
  }

  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: unknown }).code
      : null;
  if (typeof code === "string" && connectionErrorCodes.has(code)) {
    return {
      status: 503,
      message: "No se pudo conectar a la base de datos. Revisa app/libs/database.ts",
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : "Error al crear pago",
  };
}
