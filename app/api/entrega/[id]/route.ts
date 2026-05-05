import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

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
  fechaHoraRetiro: row.fechaHoraRetiro,
  observacion: row.observacion,
});

const estadoEntregaOrder = [
  "pendiente",
  "asignado",
  "en camino",
  "entregado",
  "no entregado",
];

const normalizeStatus = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const getStatusIndex = (value: string | null | undefined) => {
  const normalized = normalizeStatus(value);
  return estadoEntregaOrder.findIndex((item) => item === normalized);
};

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

    const addUpdate = (column: string, value: number | string | null) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    const textOrNull = (value: unknown) =>
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

    if (body?.idDomiciliario !== undefined || body?.id_domiciliario !== undefined) {
      const domiciliarioInput =
        body?.idDomiciliario ?? body?.id_domiciliario ?? body?.domiciliarioId ?? body?.domiciliario_id;
      if (domiciliarioInput === null || domiciliarioInput === "") {
        addUpdate("id_domiciliario", null);
      } else {
        const parsed = Number(domiciliarioInput);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          return NextResponse.json(
            { ok: false, error: "id_domiciliario debe ser un entero positivo o null" },
            { status: 400 }
          );
        }
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

    let forceFechaEntrega = false;

    if (body?.estadoEntrega !== undefined || body?.estado_entrega !== undefined) {
      const nuevoEstado = textOrNull(body?.estadoEntrega ?? body?.estado_entrega);
      if (!nuevoEstado) {
        addUpdate("estado_entrega", null);
      } else {
        const estadoIndex = getStatusIndex(nuevoEstado);
        if (estadoIndex === -1) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Estado de entrega no válido. Use Pendiente, Asignado, En camino, Entregado o No entregado.",
            },
            { status: 400 }
          );
        }

        const { rows: existingRows } = await sql<{ estadoEntrega: string | null }>(
          `SELECT estado_entrega AS "estadoEntrega" FROM public.entrega WHERE id_entrega = $1 LIMIT 1;`,
          [id]
        );

        if (!existingRows[0]) {
          return NextResponse.json({ ok: false, error: "Entrega no encontrada" }, { status: 404 });
        }

        const currentIndex = getStatusIndex(existingRows[0].estadoEntrega);
        if (currentIndex !== -1 && estadoIndex < currentIndex) {
          return NextResponse.json(
            {
              ok: false,
              error: "No se puede regresar a un estado anterior de entrega.",
            },
            { status: 400 }
          );
        }

        if (nuevoEstado.toLowerCase() === "entregado") {
          if (currentIndex !== getStatusIndex("en camino")) {
            return NextResponse.json(
              {
                ok: false,
                error: "El pedido debe estar en estado 'En camino' para confirmar la entrega.",
              },
              { status: 400 }
            );
          }
          forceFechaEntrega = true;
        }

        addUpdate("estado_entrega", nuevoEstado);
      }
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
    if (fechaAsignacionResult.value !== undefined) addUpdate("fecha_asignacion", fechaAsignacionResult.value);

    const fechaSalidaResult = parseDateOrNull(
      body?.fechaSalida ?? body?.fecha_salida,
      "fecha_salida"
    );
    if (!fechaSalidaResult.ok) return fechaSalidaResult.response;
    if (fechaSalidaResult.value !== undefined) addUpdate("fecha_salida", fechaSalidaResult.value);

    const fechaEntregaResult = parseDateOrNull(
      forceFechaEntrega ? new Date().toISOString() : body?.fechaEntrega ?? body?.fecha_entrega,
      "fecha_entrega"
    );
    if (!fechaEntregaResult.ok) return fechaEntregaResult.response;
    if (fechaEntregaResult.value !== undefined) addUpdate("fecha_entrega", fechaEntregaResult.value);

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
      addUpdate("observacion", textOrNull(body?.observacion));
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
          fecha_hora_retiro AS "fechaHoraRetiro",
          observacion;
      `,
      values
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Entrega no encontrada" }, { status: 404 });
    }

    if (normalizeStatus(rows[0].estadoEntrega) === "entregado") {
      await sql(
        `UPDATE public.pedido SET estado_pedido = 'Finalizado' WHERE id_pedido = $1;`,
        [rows[0].idPedido]
      );
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/entrega/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar la entrega" },
      { status: 500 }
    );
  }
}
