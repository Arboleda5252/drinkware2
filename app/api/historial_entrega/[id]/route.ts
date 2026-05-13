import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

type HistorialEntregaRow = {
  idHistorial: number;
  idEntrega: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: Date | string;
  comentario: string | null;
};

type EntregaEstadoRow = {
  estadoEntrega: string | null;
};

const selectById = `
  SELECT
    id_historial AS "idHistorial",
    id_entrega AS "idEntrega",
    estado_anterior AS "estadoAnterior",
    estado_nuevo AS "estadoNuevo",
    fecha_cambio AS "fechaCambio",
    comentario
  FROM public.historial_entrega
  WHERE id_historial = $1;
`;

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toDto = (row: HistorialEntregaRow) => ({
  idHistorial: Number(row.idHistorial),
  idEntrega: Number(row.idEntrega),
  estadoAnterior: row.estadoAnterior,
  estadoNuevo: row.estadoNuevo,
  fechaCambio: toIsoString(row.fechaCambio),
  comentario: row.comentario,
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

function validateShortText(value: string, field: string, required: boolean) {
  if (!value) {
    return required ? `${field} no puede estar vacio` : null;
  }

  if (value.length > 20) {
    return `${field} no puede superar 20 caracteres`;
  }

  return null;
}

function normalizeEstado(value: string | null) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized) return null;

  const map: Record<string, string> = {
    pendiente: "Pendiente",
    asignada: "Asignada",
    asignado: "Asignada",
    en_camino: "En_camino",
    entregado: "Entregado",
    no_entregado: "No_entregado",
    cancelado: "Cancelado",
  };

  return map[normalized] ?? value.trim();
}

async function validateEstadoNuevoMatchesEntrega(
  idEntrega: number,
  estadoNuevo: string
) {
  const { rows } = await sql<EntregaEstadoRow>(
    `
      SELECT estado_entrega AS "estadoEntrega"
      FROM public.entrega
      WHERE id_entrega = $1
      LIMIT 1;
    `,
    [idEntrega]
  );

  if (!rows[0]) {
    return NextResponse.json(
      { ok: false, error: "La entrega asociada no existe en la base de datos" },
      { status: 400 }
    );
  }

  const estadoEntrega = normalizeEstado(rows[0].estadoEntrega);
  const estadoNuevoNormalizado = normalizeEstado(estadoNuevo);

  if (estadoEntrega !== estadoNuevoNormalizado) {
    return NextResponse.json(
      {
        ok: false,
        error: `estado_nuevo debe coincidir con el estado actual de la entrega (${estadoEntrega ?? "Sin estado"})`,
      },
      { status: 400 }
    );
  }

  return null;
}

function parseDateInput(value: unknown, field: string) {
  if (value === undefined) {
    return { ok: true as const, value: undefined };
  }

  if (typeof value !== "string" || !value.trim() || Number.isNaN(Date.parse(value))) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: `${field} debe ser una fecha valida` },
        { status: 400 }
      ),
    };
  }

  return { ok: true as const, value: value.trim() };
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapDatabaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      return {
        status: 400,
        message: "La entrega asociada no existe en la base de datos",
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
    const { rows } = await sql<HistorialEntregaRow>(selectById, [id]);

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Historial de entrega no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/historial_entrega/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener historial de entrega" },
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
    let nextIdEntrega: number | null = null;
    let nextEstadoNuevo: string | null = null;

    const addUpdate = (column: string, value: number | string | null) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    const { rows: existingRows } = await sql<{
      idEntrega: number;
      estadoNuevo: string;
    }>(
      `
        SELECT
          id_entrega AS "idEntrega",
          estado_nuevo AS "estadoNuevo"
        FROM public.historial_entrega
        WHERE id_historial = $1
        LIMIT 1;
      `,
      [id]
    );

    if (!existingRows[0]) {
      return NextResponse.json(
        { ok: false, error: "Historial de entrega no encontrado" },
        { status: 404 }
      );
    }

    nextIdEntrega = Number(existingRows[0].idEntrega);
    nextEstadoNuevo = existingRows[0].estadoNuevo;

    if (body?.idEntrega !== undefined || body?.id_entrega !== undefined) {
      const idEntrega = readPositiveInt(body?.idEntrega ?? body?.id_entrega);
      if (idEntrega === null) {
        return NextResponse.json(
          { ok: false, error: "id_entrega debe ser un entero positivo" },
          { status: 400 }
        );
      }
      nextIdEntrega = idEntrega;
      addUpdate("id_entrega", idEntrega);
    }

    if (body?.estadoAnterior !== undefined || body?.estado_anterior !== undefined) {
      const estadoAnterior = readNullableText(body?.estadoAnterior ?? body?.estado_anterior);
      const estadoAnteriorError =
        estadoAnterior === null
          ? null
          : validateShortText(estadoAnterior, "estado_anterior", false);
      if (estadoAnteriorError) {
        return NextResponse.json({ ok: false, error: estadoAnteriorError }, { status: 400 });
      }
      addUpdate("estado_anterior", estadoAnterior);
    }

    if (body?.estadoNuevo !== undefined || body?.estado_nuevo !== undefined) {
      const estadoNuevo = readText(body?.estadoNuevo ?? body?.estado_nuevo);
      const estadoNuevoError = validateShortText(estadoNuevo, "estado_nuevo", true);
      if (estadoNuevoError) {
        return NextResponse.json({ ok: false, error: estadoNuevoError }, { status: 400 });
      }
      nextEstadoNuevo = estadoNuevo;
      addUpdate("estado_nuevo", estadoNuevo);
    }

    if (nextIdEntrega !== null && nextEstadoNuevo !== null) {
      const estadoMismatchResponse = await validateEstadoNuevoMatchesEntrega(
        nextIdEntrega,
        nextEstadoNuevo
      );
      if (estadoMismatchResponse) {
        return estadoMismatchResponse;
      }
    }

    const fechaCambioResult = parseDateInput(body?.fechaCambio ?? body?.fecha_cambio, "fecha_cambio");
    if (!fechaCambioResult.ok) {
      return fechaCambioResult.response;
    }
    if (fechaCambioResult.value !== undefined) {
      addUpdate("fecha_cambio", fechaCambioResult.value);
    }

    if (body?.comentario !== undefined) {
      addUpdate("comentario", readNullableText(body?.comentario));
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No hay campos validos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);

    const { rows } = await sql<HistorialEntregaRow>(
      `
        UPDATE public.historial_entrega
        SET ${updates.join(", ")}
        WHERE id_historial = $${values.length}
        RETURNING
          id_historial AS "idHistorial",
          id_entrega AS "idEntrega",
          estado_anterior AS "estadoAnterior",
          estado_nuevo AS "estadoNuevo",
          fecha_cambio AS "fechaCambio",
          comentario;
      `,
      values
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/historial_entrega/:id]", error);
    const { message, status } = mapDatabaseError(
      error,
      "Error al actualizar historial de entrega"
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
    const { rows } = await sql<{ idHistorial: number }>(
      `
        DELETE FROM public.historial_entrega
        WHERE id_historial = $1
        RETURNING id_historial AS "idHistorial";
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Historial de entrega no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { idHistorial: Number(rows[0].idHistorial) },
    });
  } catch (error) {
    console.error("[DELETE /api/historial_entrega/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar historial de entrega" },
      { status: 500 }
    );
  }
}
