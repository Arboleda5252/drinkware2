import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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
  fechaCancelado: string | null;
  fechaHoraRetiro: string | null;
  observacion: string | null;
};

const selectById = `
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
    fecha_cancelado AS "fechaCancelado",
    fecha_hora_retiro AS "fechaHoraRetiro",
    observacion
  FROM public.entrega
  WHERE id_entrega = $1;
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
  fechaCancelado: row.fechaCancelado,
  fechaHoraRetiro: row.fechaHoraRetiro,
  observacion: row.observacion,
});

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

type CanonicalEstadoEntrega =
  | "Pendiente"
  | "Asignada"
  | "En_camino"
  | "Entregado"
  | "No_entregado"
  | "Cancelado";

type HistorialEntregaRow = {
  idHistorial: number;
};

type PagoPedidoRow = {
  metodoPago: string | null;
};

function normalizeEstadoEntrega(value: string | null): CanonicalEstadoEntrega | null {
  if (!value) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return null;

  const map: Record<string, CanonicalEstadoEntrega> = {
    pendiente: "Pendiente",
    asignada: "Asignada",
    asignado: "Asignada",
    en_camino: "En_camino",
    entregado: "Entregado",
    no_entregado: "No_entregado",
    cancelado: "Cancelado",
  };

  return map[normalized] ?? null;
}

function canTransitionEstadoEntrega(
  current: CanonicalEstadoEntrega | null,
  next: CanonicalEstadoEntrega
) {
  if (current === null) {
    return next === "Pendiente" || next === "Asignada";
  }

  if (current === next) {
    return true;
  }

  const allowedTransitions: Record<CanonicalEstadoEntrega, CanonicalEstadoEntrega[]> = {
    Pendiente: [],
    Asignada: ["En_camino", "Cancelado"],
    En_camino: ["Entregado", "No_entregado", "Cancelado"],
    Entregado: [],
    No_entregado: ["En_camino", "Cancelado"],
    Cancelado: [],
  };

  return allowedTransitions[current].includes(next);
}

function buildHistorialComentario(
  next: CanonicalEstadoEntrega,
  observacion: string | null
) {
  const baseComments: Record<
    Exclude<CanonicalEstadoEntrega, "Pendiente" | "Asignada">,
    string
  > = {
    En_camino: "El pedido salio a entrega.",
    Entregado: "El pedido fue entregado.",
    No_entregado: "El pedido fue no entregado.",
    Cancelado: "El pedido fue cancelado.",
  };

  const baseComment = baseComments[next as keyof typeof baseComments];
  if (!baseComment) return null;

  if (!observacion) {
    return baseComment;
  }

  return `${baseComment} Motivo: ${observacion}`;
}

function normalizeMetodoPago(value: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function isContraentrega(value: string | null) {
  return normalizeMetodoPago(value) === "contraentrega";
}

async function getTipoEntregaPedidoByEntregaId(idEntrega: number) {
  const { rows } = await sql<{ tipoEntrega: string | null }>(
    `
      SELECT p.tipo_entrega AS "tipoEntrega"
      FROM public.entrega AS e
      INNER JOIN public.pedido AS p ON p.id_pedido = e.id_pedido
      WHERE e.id_entrega = $1
      LIMIT 1;
    `,
    [idEntrega]
  );

  return rows[0]?.tipoEntrega ?? null;
}

async function getUltimoMetodoPagoByPedidoId(idPedido: number) {
  const { rows } = await sql<PagoPedidoRow>(
    `
      SELECT metodo_pago AS "metodoPago"
      FROM public.pago
      WHERE id_pedido = $1
      ORDER BY id_pago DESC
      LIMIT 1;
    `,
    [idPedido]
  );

  return rows[0]?.metodoPago ?? null;
}

async function restockProductosDePedido(idPedido: number) {
  await sql(
    `
      UPDATE public.producto AS p
      SET stock = p.stock + dp.cantidad
      FROM public.detalle_pedido AS dp
      WHERE dp.id_pedido = $1
        AND dp.id_producto = p.idproducto;
    `,
    [idPedido]
  );
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<EntregaRow>(selectById, [id]);

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Entrega no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/entrega/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener la entrega" },
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
    const updateIndexes = new Map<string, number>();
    let nextIdDomiciliario: number | null | undefined = undefined;
    let nextObservacion: string | null | undefined = undefined;
    let nextFotoEvidencia: string | null = null;

    const addUpdate = (column: string, value: number | string | null) => {
      const existingIndex = updateIndexes.get(column);
      if (existingIndex !== undefined) {
        values[existingIndex] = value;
        return;
      }

      values.push(value);
      updateIndexes.set(column, values.length - 1);
      updates.push(`${column} = $${values.length}`);
    };

    const textOrNull = (value: unknown) =>
      typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

    const imageDataOrNull = (value: unknown) =>
      typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

    const parseDateOrNull = (value: unknown, field: string) => {
      if (value === undefined) return { ok: true as const, value: undefined };
      if (value === null || value === "") return { ok: true as const, value: null as string | null };
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

    if (
      body?.idDomiciliario !== undefined ||
      body?.id_domiciliario !== undefined ||
      body?.domiciliarioId !== undefined ||
      body?.domiciliario_id !== undefined
    ) {
      const domiciliarioInput =
        body?.idDomiciliario ?? body?.id_domiciliario ?? body?.domiciliarioId ?? body?.domiciliario_id;
      if (domiciliarioInput === null || domiciliarioInput === "") {
        nextIdDomiciliario = null;
        addUpdate("id_domiciliario", null);
      } else {
        const parsed = Number(domiciliarioInput);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          return NextResponse.json(
            { ok: false, error: "id_domiciliario debe ser un entero positivo o null" },
            { status: 400 }
          );
        }
        nextIdDomiciliario = parsed;
        addUpdate("id_domiciliario", parsed);
      }
    }

    if (body?.direccionEntrega !== undefined || body?.direccion_entrega !== undefined) {
      addUpdate("direccion_entrega", textOrNull(body?.direccionEntrega ?? body?.direccion_entrega));
    }

    if (body?.ciudad !== undefined) {
      addUpdate("ciudad", textOrNull(body?.ciudad));
    }

    if (body?.telefonoContacto !== undefined || body?.telefono_contacto !== undefined) {
      addUpdate("telefono_contacto", textOrNull(body?.telefonoContacto ?? body?.telefono_contacto));
    }

    if (body?.nombreRecibe !== undefined || body?.nombre_recibe !== undefined) {
      addUpdate("nombre_recibe", textOrNull(body?.nombreRecibe ?? body?.nombre_recibe));
    }

    if (body?.costoEnvio !== undefined || body?.costo_envio !== undefined) {
      const costoEnvio = Number(body?.costoEnvio ?? body?.costo_envio);
      if (!Number.isFinite(costoEnvio) || costoEnvio < 0) {
        return NextResponse.json(
          { ok: false, error: "costo_envio debe ser un numero valido" },
          { status: 400 }
        );
      }
      addUpdate("costo_envio", costoEnvio);
    }

    const { rows: existingRows } = await sql<{
      estadoEntrega: string | null;
      observacion: string | null;
    }>(
      `
        SELECT
          estado_entrega AS "estadoEntrega",
          observacion
        FROM public.entrega
        WHERE id_entrega = $1
        LIMIT 1;
      `,
      [id]
    );

    if (!existingRows[0]) {
      return NextResponse.json({ ok: false, error: "Entrega no encontrada" }, { status: 404 });
    }

    const currentEstadoEntrega = normalizeEstadoEntrega(existingRows[0].estadoEntrega);
    const estadoEntregaInput = normalizeEstadoEntrega(
      textOrNull(body?.estadoEntrega ?? body?.estado_entrega)
    );
    if (body?.estadoEntrega !== undefined || body?.estado_entrega !== undefined) {
      if (estadoEntregaInput === null) {
        return NextResponse.json(
          {
            ok: false,
            error: "Estado de entrega no valido. Use Asignada, En_camino, Entregado, No_entregado o Cancelado.",
          },
          { status: 400 }
        );
      }

      if (!canTransitionEstadoEntrega(currentEstadoEntrega, estadoEntregaInput)) {
        return NextResponse.json(
          {
            ok: false,
            error: "No se permite retroceder el estado, excepto de No_entregado a En_camino.",
          },
          { status: 400 }
        );
      }

      if (currentEstadoEntrega === "Pendiente") {
        return NextResponse.json(
          {
            ok: false,
            error: "No se puede actualizar el estado mientras la entrega siga en Pendiente.",
          },
          { status: 400 }
        );
      }

      addUpdate("estado_entrega", estadoEntregaInput);
    } else if (nextIdDomiciliario !== undefined && nextIdDomiciliario !== null) {
      addUpdate("estado_entrega", "Asignada");
    }

    const fechaProgramadaResult = parseDateOrNull(
      body?.fechaProgramada ?? body?.fecha_programada,
      "fecha_programada"
    );
    if (!fechaProgramadaResult.ok) return fechaProgramadaResult.response;
    if (fechaProgramadaResult.value !== undefined) addUpdate("fecha_programada", fechaProgramadaResult.value);

    const fechaAsignacionResult = parseDateOrNull(
      body?.fechaAsignacion ?? body?.fecha_asignacion,
      "fecha_asignacion"
    );
    if (!fechaAsignacionResult.ok) return fechaAsignacionResult.response;
    if (fechaAsignacionResult.value !== undefined) {
      addUpdate("fecha_asignacion", fechaAsignacionResult.value);
    } else if (nextIdDomiciliario !== undefined) {
      addUpdate("fecha_asignacion", nextIdDomiciliario === null ? null : new Date().toISOString());
    }

    const fechaSalidaResult = parseDateOrNull(
      body?.fechaSalida ?? body?.fecha_salida,
      "fecha_salida"
    );
    if (!fechaSalidaResult.ok) return fechaSalidaResult.response;
    if (fechaSalidaResult.value !== undefined) {
      addUpdate("fecha_salida", fechaSalidaResult.value);
    } else if (estadoEntregaInput === "En_camino") {
      addUpdate("fecha_salida", new Date().toISOString());
    }

    const fechaEntregaResult = parseDateOrNull(
      body?.fechaEntrega ?? body?.fecha_entrega,
      "fecha_entrega"
    );
    if (!fechaEntregaResult.ok) return fechaEntregaResult.response;
    if (fechaEntregaResult.value !== undefined) {
      addUpdate("fecha_entrega", fechaEntregaResult.value);
    } else if (estadoEntregaInput === "Entregado") {
      addUpdate("fecha_entrega", new Date().toISOString());
    }

    const fechaCanceladoResult = parseDateOrNull(
      body?.fechaCancelado ?? body?.fecha_cancelado,
      "fecha_cancelado"
    );
    if (!fechaCanceladoResult.ok) return fechaCanceladoResult.response;
    if (fechaCanceladoResult.value !== undefined) {
      addUpdate("fecha_cancelado", fechaCanceladoResult.value);
    } else if (estadoEntregaInput === "Cancelado") {
      addUpdate("fecha_cancelado", new Date().toISOString());
    }

    const fechaHoraRetiroResult = parseDateOrNull(
      body?.fechaHoraRetiro ?? body?.fecha_hora_retiro,
      "fecha_hora_retiro"
    );
    if (!fechaHoraRetiroResult.ok) return fechaHoraRetiroResult.response;
    if (fechaHoraRetiroResult.value !== undefined) {
      const tipoEntregaPedido = await getTipoEntregaPedidoByEntregaId(id);
      addUpdate(
        "fecha_hora_retiro",
        (tipoEntregaPedido ?? "").toLowerCase() === "domicilio" ? null : fechaHoraRetiroResult.value
      );
    }

    if (body?.observacion !== undefined) {
      nextObservacion = textOrNull(body?.observacion);
      addUpdate("observacion", nextObservacion);
    }

    if (body?.fotoEvidencia !== undefined || body?.foto_evidencia !== undefined) {
      nextFotoEvidencia = imageDataOrNull(body?.fotoEvidencia ?? body?.foto_evidencia);
    }

    if (
      (estadoEntregaInput === "No_entregado" || estadoEntregaInput === "Cancelado") &&
      nextObservacion === undefined
    ) {
      nextObservacion = existingRows[0].observacion;
    }

    if (estadoEntregaInput === "En_camino") {
      addUpdate("fecha_entrega", null);
      addUpdate("fecha_cancelado", null);
    }

    if (estadoEntregaInput === "Entregado") {
      addUpdate("fecha_cancelado", null);
    }

    if (estadoEntregaInput === "No_entregado") {
      addUpdate("fecha_entrega", null);
      addUpdate("fecha_cancelado", null);
    }

    if (estadoEntregaInput === "Cancelado") {
      addUpdate("fecha_entrega", null);
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No hay campos validos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);
    const index = values.length;

    const { rows } = await sql<EntregaRow>(
      `
        UPDATE public.entrega
        SET ${updates.join(", ")}
        WHERE id_entrega = $${index}
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
          fecha_cancelado AS "fechaCancelado",
          fecha_hora_retiro AS "fechaHoraRetiro",
          observacion;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Entrega no encontrada" }, { status: 404 });
    }

    const shouldRestockContraentrega =
      estadoEntregaInput === "Cancelado" && currentEstadoEntrega !== "Cancelado";

    if (shouldRestockContraentrega) {
      const metodoPago = await getUltimoMetodoPagoByPedidoId(Number(rows[0].idPedido));

      if (isContraentrega(metodoPago)) {
        await restockProductosDePedido(Number(rows[0].idPedido));
      }
    }

    if (
      estadoEntregaInput &&
      estadoEntregaInput !== currentEstadoEntrega &&
      ["En_camino", "Entregado", "No_entregado", "Cancelado"].includes(estadoEntregaInput)
    ) {
      const comentario = buildHistorialComentario(
        estadoEntregaInput,
        nextObservacion ?? existingRows[0].observacion
      );

      await sql<HistorialEntregaRow>(
        `
          INSERT INTO public.historial_entrega
            (id_entrega, estado_anterior, estado_nuevo, fecha_cambio, comentario, foto_evidencia)
          VALUES
            ($1::integer, $2::varchar(20), $3::varchar(20), $4::timestamp, $5::text, $6::text)
          RETURNING id_historial AS "idHistorial";
        `,
        [
          id,
          currentEstadoEntrega,
          estadoEntregaInput,
          new Date().toISOString(),
          comentario,
          nextFotoEvidencia,
        ]
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/entrega/:id]", error);
    if (error instanceof DatabaseError) {
      if (error.code === "23503") {
        return NextResponse.json(
          { ok: false, error: "El domiciliario asociado no existe en la base de datos" },
          { status: 400 }
        );
      }
    }

    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: unknown }).code
        : null;
    if (typeof code === "string" && connectionErrorCodes.has(code)) {
      return NextResponse.json(
        { ok: false, error: "No se pudo conectar a la base de datos. Revisa app/libs/database.ts" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Error al actualizar la entrega" },
      { status: 500 }
    );
  }
}
