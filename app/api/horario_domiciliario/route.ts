import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type HorarioDomiciliarioRow = {
  idHorario: number;
  idDomiciliario: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};

const baseSelect = `
  SELECT
    id_horario AS "idHorario",
    id_domiciliario AS "idDomiciliario",
    dia_semana AS "diaSemana",
    hora_inicio::text AS "horaInicio",
    hora_fin::text AS "horaFin",
    activo
  FROM public.horario_domiciliario
`;

const toDto = (row: HorarioDomiciliarioRow) => ({
  idHorario: Number(row.idHorario),
  idDomiciliario: Number(row.idDomiciliario),
  diaSemana: row.diaSemana,
  horaInicio: row.horaInicio,
  horaFin: row.horaFin,
  activo: Boolean(row.activo),
});

function readPositiveInt(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
}

function validateDiaSemana(value: string) {
  if (!value) {
    return "dia_semana no puede estar vacio";
  }

  if (value.length > 15) {
    return "dia_semana no puede superar 15 caracteres";
  }

  return null;
}

function normalizeTime(value: unknown, field: string) {
  if (typeof value !== "string") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: `${field} debe ser una hora valida` },
        { status: 400 }
      ),
    };
  }

  const text = value.trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(text)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: `${field} debe tener formato HH:MM o HH:MM:SS` },
        { status: 400 }
      ),
    };
  }

  const [hourPart, minutePart, secondPart] = text.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);
  const seconds = secondPart === undefined ? 0 : Number(secondPart);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: `${field} debe ser una hora valida` },
        { status: 400 }
      ),
    };
  }

  return {
    ok: true as const,
    value: `${hourPart}:${minutePart}:${secondPart ?? "00"}`,
  };
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapDatabaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      return {
        status: 400,
        message: "El domiciliario asociado no existe en la base de datos",
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
    const { rows } = await sql<HorarioDomiciliarioRow>(
      `${baseSelect} ORDER BY id_domiciliario ASC, dia_semana ASC, hora_inicio ASC, id_horario ASC;`
    );
    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/horario_domiciliario]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar horarios de domiciliarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const idDomiciliario = readPositiveInt(
      body?.idDomiciliario ?? body?.id_domiciliario ?? body?.domiciliarioId ?? body?.domiciliario_id
    );
    if (idDomiciliario === null) {
      return NextResponse.json(
        { ok: false, error: "id_domiciliario debe ser un entero positivo" },
        { status: 400 }
      );
    }

    const diaSemana = readText(body?.diaSemana ?? body?.dia_semana);
    const diaSemanaError = validateDiaSemana(diaSemana);
    if (diaSemanaError) {
      return NextResponse.json({ ok: false, error: diaSemanaError }, { status: 400 });
    }

    const horaInicioResult = normalizeTime(body?.horaInicio ?? body?.hora_inicio, "hora_inicio");
    if (!horaInicioResult.ok) {
      return horaInicioResult.response;
    }

    const horaFinResult = normalizeTime(body?.horaFin ?? body?.hora_fin, "hora_fin");
    if (!horaFinResult.ok) {
      return horaFinResult.response;
    }

    const activoInput = body?.activo;
    const activo = activoInput === undefined ? true : readBoolean(activoInput);
    if (activo === null) {
      return NextResponse.json(
        { ok: false, error: "activo debe ser un booleano" },
        { status: 400 }
      );
    }

    const { rows } = await sql<HorarioDomiciliarioRow>(
      `
        INSERT INTO public.horario_domiciliario
          (id_domiciliario, dia_semana, hora_inicio, hora_fin, activo)
        VALUES
          ($1::integer, $2::varchar(15), $3::time, $4::time, $5::boolean)
        RETURNING
          id_horario AS "idHorario",
          id_domiciliario AS "idDomiciliario",
          dia_semana AS "diaSemana",
          hora_inicio::text AS "horaInicio",
          hora_fin::text AS "horaFin",
          activo;
      `,
      [idDomiciliario, diaSemana, horaInicioResult.value, horaFinResult.value, activo]
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/horario_domiciliario]", error);
    const { message, status } = mapDatabaseError(
      error,
      "Error al crear horario de domiciliario"
    );
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
