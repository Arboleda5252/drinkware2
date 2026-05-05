import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type HorarioDomiciliarioRow = {
  idHorario: number;
  idDomiciliario: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};

const selectById = `
  SELECT
    id_horario AS "idHorario",
    id_domiciliario AS "idDomiciliario",
    dia_semana AS "diaSemana",
    hora_inicio::text AS "horaInicio",
    hora_fin::text AS "horaFin",
    activo
  FROM public.horario_domiciliario
  WHERE id_horario = $1;
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

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<HorarioDomiciliarioRow>(selectById, [id]);

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Horario de domiciliario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/horario_domiciliario/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener horario de domiciliario" },
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

  try {
    const body = await req.json().catch(() => ({}));
    const updates: string[] = [];
    const values: Array<number | string | boolean> = [];

    const addUpdate = (column: string, value: number | string | boolean) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (
      body?.idDomiciliario !== undefined ||
      body?.id_domiciliario !== undefined ||
      body?.domiciliarioId !== undefined ||
      body?.domiciliario_id !== undefined
    ) {
      const idDomiciliario = readPositiveInt(
        body?.idDomiciliario ?? body?.id_domiciliario ?? body?.domiciliarioId ?? body?.domiciliario_id
      );
      if (idDomiciliario === null) {
        return NextResponse.json(
          { ok: false, error: "id_domiciliario debe ser un entero positivo" },
          { status: 400 }
        );
      }
      addUpdate("id_domiciliario", idDomiciliario);
    }

    if (body?.diaSemana !== undefined || body?.dia_semana !== undefined) {
      const diaSemana = readText(body?.diaSemana ?? body?.dia_semana);
      const diaSemanaError = validateDiaSemana(diaSemana);
      if (diaSemanaError) {
        return NextResponse.json({ ok: false, error: diaSemanaError }, { status: 400 });
      }
      addUpdate("dia_semana", diaSemana);
    }

    if (body?.horaInicio !== undefined || body?.hora_inicio !== undefined) {
      const horaInicioResult = normalizeTime(body?.horaInicio ?? body?.hora_inicio, "hora_inicio");
      if (!horaInicioResult.ok) {
        return horaInicioResult.response;
      }
      addUpdate("hora_inicio", horaInicioResult.value);
    }

    if (body?.horaFin !== undefined || body?.hora_fin !== undefined) {
      const horaFinResult = normalizeTime(body?.horaFin ?? body?.hora_fin, "hora_fin");
      if (!horaFinResult.ok) {
        return horaFinResult.response;
      }
      addUpdate("hora_fin", horaFinResult.value);
    }

    if (body?.activo !== undefined) {
      const activo = readBoolean(body?.activo);
      if (activo === null) {
        return NextResponse.json(
          { ok: false, error: "activo debe ser un booleano" },
          { status: 400 }
        );
      }
      addUpdate("activo", activo);
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No hay campos validos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);

    const { rows } = await sql<HorarioDomiciliarioRow>(
      `
        UPDATE public.horario_domiciliario
        SET ${updates.join(", ")}
        WHERE id_horario = $${values.length}
        RETURNING
          id_horario AS "idHorario",
          id_domiciliario AS "idDomiciliario",
          dia_semana AS "diaSemana",
          hora_inicio::text AS "horaInicio",
          hora_fin::text AS "horaFin",
          activo;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Horario de domiciliario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/horario_domiciliario/:id]", error);
    const { message, status } = mapDatabaseError(
      error,
      "Error al actualizar horario de domiciliario"
    );
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<{ idHorario: number }>(
      `
        DELETE FROM public.horario_domiciliario
        WHERE id_horario = $1
        RETURNING id_horario AS "idHorario";
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Horario de domiciliario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { idHorario: Number(rows[0].idHorario) },
    });
  } catch (error) {
    console.error("[DELETE /api/horario_domiciliario/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar horario de domiciliario" },
      { status: 500 }
    );
  }
}
