import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import { sql } from "@/app/Datalibs/database";
import { applyComputedDisponibilidad } from "../availability";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type DomiciliarioRow = {
  idDomiciliario: number;
  idUsuario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
  observaciones: string | null;
};

const selectById = `
  SELECT
    id_domiciliario AS "idDomiciliario",
    id_usuario AS "idUsuario",
    estado_laboral AS "estadoLaboral",
    disponibilidad_manual AS "disponibilidadManual",
    observaciones
  FROM public.domiciliario
  WHERE id_domiciliario = $1;
`;

const toDto = (row: DomiciliarioRow) => ({
  idDomiciliario: Number(row.idDomiciliario),
  idUsuario: Number(row.idUsuario),
  estadoLaboral: row.estadoLaboral,
  disponibilidadManual: row.disponibilidadManual,
  observaciones: row.observaciones,
});

function readPositiveInt(value: unknown) {
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

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<DomiciliarioRow>(selectById, [id]);

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Domiciliario no encontrado" },
        { status: 404 }
      );
    }

    const [rowWithDisponibilidad] = await applyComputedDisponibilidad(rows);
    return NextResponse.json({ ok: true, data: toDto(rowWithDisponibilidad) });
  } catch (error) {
    console.error("[GET /api/domiciliario/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener domiciliario" },
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
    const values: Array<number | string | null> = [];

    const addUpdate = (column: string, value: number | string | null) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (
      body?.idUsuario !== undefined ||
      body?.id_usuario !== undefined ||
      body?.usuarioId !== undefined ||
      body?.usuario_id !== undefined
    ) {
      const idUsuario = readPositiveInt(
        body?.idUsuario ?? body?.id_usuario ?? body?.usuarioId ?? body?.usuario_id
      );
      if (idUsuario === null) {
        return NextResponse.json(
          { ok: false, error: "id_usuario debe ser un entero positivo" },
          { status: 400 }
        );
      }
      addUpdate("id_usuario", idUsuario);
    }

    if (body?.estadoLaboral !== undefined || body?.estado_laboral !== undefined) {
      const estadoLaboral = readText(body?.estadoLaboral ?? body?.estado_laboral);
      const estadoLaboralError = validateShortText(estadoLaboral, "estado_laboral");
      if (estadoLaboralError) {
        return NextResponse.json({ ok: false, error: estadoLaboralError }, { status: 400 });
      }
      addUpdate("estado_laboral", estadoLaboral);
    }

    if (
      body?.disponibilidadManual !== undefined ||
      body?.disponibilidad_manual !== undefined
    ) {
      const disponibilidadManual = normalizeDisponibilidadManual(
        readText(body?.disponibilidadManual ?? body?.disponibilidad_manual)
      );
      const disponibilidadError = validateShortText(
        disponibilidadManual,
        "disponibilidad_manual"
      );
      if (disponibilidadError) {
        return NextResponse.json({ ok: false, error: disponibilidadError }, { status: 400 });
      }
      addUpdate("disponibilidad_manual", disponibilidadManual);
    }

    if (body?.observaciones !== undefined) {
      addUpdate("observaciones", readNullableText(body?.observaciones));
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No hay campos validos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);

    const { rows } = await sql<DomiciliarioRow>(
      `
        UPDATE public.domiciliario
        SET ${updates.join(", ")}
        WHERE id_domiciliario = $${values.length}
        RETURNING
          id_domiciliario AS "idDomiciliario",
          id_usuario AS "idUsuario",
          estado_laboral AS "estadoLaboral",
          disponibilidad_manual AS "disponibilidadManual",
          observaciones;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Domiciliario no encontrado" },
        { status: 404 }
      );
    }

    const [rowWithDisponibilidad] = await applyComputedDisponibilidad(rows);
    return NextResponse.json({ ok: true, data: toDto(rowWithDisponibilidad) });
  } catch (error) {
    console.error("[PUT /api/domiciliario/:id]", error);
    const { message, status } = mapDatabaseError(error, "Error al actualizar domiciliario");
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
    const { rows } = await sql<{ idDomiciliario: number }>(
      `
        DELETE FROM public.domiciliario
        WHERE id_domiciliario = $1
        RETURNING id_domiciliario AS "idDomiciliario";
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Domiciliario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { idDomiciliario: Number(rows[0].idDomiciliario) },
    });
  } catch (error) {
    console.error("[DELETE /api/domiciliario/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar domiciliario" },
      { status: 500 }
    );
  }
}
