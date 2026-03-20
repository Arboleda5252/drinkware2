import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

type EntregaRow = {
  idEntrega: number;
  idPedido: number;
  idDomiciliario: number | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  nombreRecibe: string | null;
  costoEnvio: number | string;
  estadoEntrega: string | null;
  fechaProgramada: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  observacion: string | null;
};

const baseSelect = `
  SELECT
    id_entrega AS "idEntrega",
    id_pedido AS "idPedido",
    id_domiciliario AS "idDomiciliario",
    direccion_entrega AS "direccionEntrega",
    ciudad,
    telefono_contacto AS "telefonoContacto",
    nombre_recibe AS "nombreRecibe",
    costo_envio AS "costoEnvio",
    estado_entrega AS "estadoEntrega",
    fecha_programada AS "fechaProgramada",
    fecha_asignacion AS "fechaAsignacion",
    fecha_salida AS "fechaSalida",
    fecha_entrega AS "fechaEntrega",
    observacion
  FROM public.entrega
`;

const toDto = (row: EntregaRow) => ({
  idEntrega: Number(row.idEntrega),
  idPedido: Number(row.idPedido),
  idDomiciliario: row.idDomiciliario === null ? null : Number(row.idDomiciliario),
  direccionEntrega: row.direccionEntrega,
  ciudad: row.ciudad,
  telefonoContacto: row.telefonoContacto,
  nombreRecibe: row.nombreRecibe,
  costoEnvio: Number(row.costoEnvio),
  estadoEntrega: row.estadoEntrega,
  fechaProgramada: row.fechaProgramada,
  fechaAsignacion: row.fechaAsignacion,
  fechaSalida: row.fechaSalida,
  fechaEntrega: row.fechaEntrega,
  observacion: row.observacion,
});

export async function GET() {
  try {
    const { rows } = await sql<EntregaRow>(`${baseSelect} ORDER BY id_entrega DESC;`);
    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/entrega]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar entregas" },
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

    const domiciliarioInput =
      body?.idDomiciliario ?? body?.id_domiciliario ?? body?.domiciliarioId ?? body?.domiciliario_id;
    let idDomiciliario: number | null = null;
    if (domiciliarioInput !== undefined && domiciliarioInput !== null && domiciliarioInput !== "") {
      const parsed = Number(domiciliarioInput);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
          { ok: false, error: "id_domiciliario debe ser un entero positivo o null" },
          { status: 400 }
        );
      }
      idDomiciliario = parsed;
    }

    const costoEnvioInput = body?.costoEnvio ?? body?.costo_envio;
    const costoEnvio = costoEnvioInput === undefined || costoEnvioInput === null || costoEnvioInput === ""
      ? 0
      : Number(costoEnvioInput);
    if (!Number.isFinite(costoEnvio) || costoEnvio < 0) {
      return NextResponse.json(
        { ok: false, error: "costo_envio debe ser un numero valido" },
        { status: 400 }
      );
    }

    const textOrNull = (value: unknown) =>
      typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

    const direccionEntrega = textOrNull(body?.direccionEntrega ?? body?.direccion_entrega);
    const ciudad = textOrNull(body?.ciudad);
    const telefonoContacto = textOrNull(body?.telefonoContacto ?? body?.telefono_contacto);
    const nombreRecibe = textOrNull(body?.nombreRecibe ?? body?.nombre_recibe);
    const estadoEntrega =
      textOrNull(body?.estadoEntrega ?? body?.estado_entrega) ?? "pendiente";
    const observacion = textOrNull(body?.observacion);

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

    const fechaProgramadaResult = parseDateOrNull(
      body?.fechaProgramada ?? body?.fecha_programada,
      "fecha_programada"
    );
    if (!fechaProgramadaResult.ok) {
      return fechaProgramadaResult.response;
    }

    const fechaAsignacionResult = parseDateOrNull(
      body?.fechaAsignacion ?? body?.fecha_asignacion,
      "fecha_asignacion"
    );
    if (!fechaAsignacionResult.ok) {
      return fechaAsignacionResult.response;
    }

    const fechaSalidaResult = parseDateOrNull(
      body?.fechaSalida ?? body?.fecha_salida,
      "fecha_salida"
    );
    if (!fechaSalidaResult.ok) {
      return fechaSalidaResult.response;
    }

    const fechaEntregaResult = parseDateOrNull(
      body?.fechaEntrega ?? body?.fecha_entrega,
      "fecha_entrega"
    );
    if (!fechaEntregaResult.ok) {
      return fechaEntregaResult.response;
    }

    const { rows } = await sql<EntregaRow>(
      `
        INSERT INTO public.entrega
          (
            id_pedido,
            id_domiciliario,
            direccion_entrega,
            ciudad,
            telefono_contacto,
            nombre_recibe,
            costo_envio,
            estado_entrega,
            fecha_programada,
            fecha_asignacion,
            fecha_salida,
            fecha_entrega,
            observacion
          )
        VALUES
          (
            $1::integer,
            $2::integer,
            $3::varchar(255),
            $4::varchar(100),
            $5::varchar(30),
            $6::varchar(150),
            $7::numeric(12,2),
            $8::varchar(20),
            $9::timestamp,
            $10::timestamp,
            $11::timestamp,
            $12::timestamp,
            $13::text
          )
        RETURNING
          id_entrega AS "idEntrega",
          id_pedido AS "idPedido",
          id_domiciliario AS "idDomiciliario",
          direccion_entrega AS "direccionEntrega",
          ciudad,
          telefono_contacto AS "telefonoContacto",
          nombre_recibe AS "nombreRecibe",
          costo_envio AS "costoEnvio",
          estado_entrega AS "estadoEntrega",
          fecha_programada AS "fechaProgramada",
          fecha_asignacion AS "fechaAsignacion",
          fecha_salida AS "fechaSalida",
          fecha_entrega AS "fechaEntrega",
          observacion;
      `,
      [
        idPedido,
        idDomiciliario,
        direccionEntrega,
        ciudad,
        telefonoContacto,
        nombreRecibe,
        costoEnvio,
        estadoEntrega,
        fechaProgramadaResult.value,
        fechaAsignacionResult.value,
        fechaSalidaResult.value,
        fechaEntregaResult.value,
        observacion,
      ]
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/entrega]", error);
    const { message, status } = mapEntregaError(error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapEntregaError(error: unknown) {
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
        message: "El domiciliario asociado no existe en la base de datos",
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
    message: error instanceof Error ? error.message : "Error al crear la entrega",
  };
}