import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import { sql } from "@/app/Datalibs/database";
import { applyComputedDisponibilidad } from "./availability";

export const runtime = "nodejs";

type DomiciliarioRow = {
  idDomiciliario: number;
  idUsuario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
  observaciones: string | null;
};

const baseSelect = `
  SELECT
    id_domiciliario AS "idDomiciliario",
    id_usuario AS "idUsuario",
    estado_laboral AS "estadoLaboral",
    disponibilidad_manual AS "disponibilidadManual",
    observaciones
  FROM public.domiciliario
`;

const toDto = (row: DomiciliarioRow) => ({
  idDomiciliario: Number(row.idDomiciliario),
  idUsuario: Number(row.idUsuario),
  estadoLaboral: row.estadoLaboral,
  disponibilidadManual: row.disponibilidadManual,
  observaciones: row.observaciones,
});

function readRequiredPositiveInt(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableText(value: unknown) {
  const text = readText(value);
  return text ? text : null;
}

function validateShortText(value: string, field: string) {
  if (!value) {
    return `${field} no puede estar vacio`;
  }

  if (value.length > 20) {
    return `${field} no puede superar 20 caracteres`;
  }

  return null;
}

function normalizeDisponibilidadManual(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "desconectado") return "Desconectado";
  if (normalized === "disponible") return "Disponible";
  if (normalized === "ocupado") return "Ocupado";

  return value.trim();
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapDatabaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      return {
        status: 400,
        message: "El usuario asociado no existe en la base de datos",
      };
    }

    if (error.code === "23505") {
      return {
        status: 409,
        message: "Ya existe un domiciliario asociado a este usuario",
      };
    }

    return {
      status: 500,
      message: error.detail ?? error.message ?? fallbackMessage,
    };
  }

  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: unknown }).code
      : null;
  if (typeof code === "string" && connectionErrorCodes.has(code)) {
    return {
      status: 503,
      message: "No se pudo conectar a la base de datos. Revisa app/Datalibs/database.ts",
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
}

export async function GET() {
  try {
    const { rows } = await sql<DomiciliarioRow>(`${baseSelect} ORDER BY id_domiciliario ASC;`);
    const rowsWithDisponibilidad = await applyComputedDisponibilidad(rows);
    return NextResponse.json({ ok: true, data: rowsWithDisponibilidad.map(toDto) });
  } catch (error) {
    console.error("[GET /api/domiciliario]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar domiciliarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const idUsuario = readRequiredPositiveInt(
      body?.idUsuario ?? body?.id_usuario ?? body?.usuarioId ?? body?.usuario_id
    );
    if (idUsuario === null) {
      return NextResponse.json(
        { ok: false, error: "id_usuario debe ser un entero positivo" },
        { status: 400 }
      );
    }

    const estadoLaboral = readText(body?.estadoLaboral ?? body?.estado_laboral) || "Activo";
    const estadoLaboralError = validateShortText(estadoLaboral, "estado_laboral");
    if (estadoLaboralError) {
      return NextResponse.json({ ok: false, error: estadoLaboralError }, { status: 400 });
    }

    const disponibilidadManual = normalizeDisponibilidadManual(
      readText(body?.disponibilidadManual ?? body?.disponibilidad_manual) || "Desconectado"
    );
    const disponibilidadError = validateShortText(
      disponibilidadManual,
      "disponibilidad_manual"
    );
    if (disponibilidadError) {
      return NextResponse.json({ ok: false, error: disponibilidadError }, { status: 400 });
    }

    const observaciones = readNullableText(body?.observaciones);

    const { rows } = await sql<DomiciliarioRow>(
      `
        INSERT INTO public.domiciliario
          (id_usuario, estado_laboral, disponibilidad_manual, observaciones)
        VALUES
          ($1::integer, $2::varchar(20), $3::varchar(20), $4::text)
        RETURNING
          id_domiciliario AS "idDomiciliario",
          id_usuario AS "idUsuario",
          estado_laboral AS "estadoLaboral",
          disponibilidad_manual AS "disponibilidadManual",
          observaciones;
      `,
      [idUsuario, estadoLaboral, disponibilidadManual, observaciones]
    );

    const [rowWithDisponibilidad] = await applyComputedDisponibilidad(rows);
    return NextResponse.json({ ok: true, data: toDto(rowWithDisponibilidad) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/domiciliario]", error);
    const { message, status } = mapDatabaseError(error, "Error al crear domiciliario");
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
