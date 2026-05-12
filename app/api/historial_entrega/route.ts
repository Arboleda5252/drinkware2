import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { getUserFromSession } from "@/app/Datalibs/auth";

export const runtime = "nodejs";

type HistorialEntrega = {
  idHistorial: number;
  idEntrega: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  idUsuario: number;
  comentario: string | null;
  fotoEvidencia: string | null;
  entrega: {
    idEntrega: number;
    idPedido: number;
    idDomiciliario: number | null;
    nombreRecibe: string | null;
    direccionEntrega: string | null;
    ciudad: string | null;
    estadoEntrega: string | null;
    fechaSalida: string | null;
    fechaEntrega: string | null;
    costoEnvio: string;
    observacion: string | null;
  } | null;
  usuario: {
    idUsuario: number;
    nombre: string;
    email: string;
  } | null;
};

// GET - Obtener historial de entregas del domiciliario
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession();

    if (!user?.idusuario) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const estado = searchParams.get("estado");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = `
      SELECT
        h.id_historial,
        h.id_entrega,
        h.estado_anterior,
        h.estado_nuevo,
        h.fecha_cambio,
        h.id_usuario,
        h.comentario,
        h.foto_evidencia,

        e.id_entrega AS entrega_id_entrega,
        e.id_pedido AS entrega_id_pedido,
        e.id_domiciliario AS entrega_id_domiciliario,
        e.nombre_recibe AS entrega_nombre_recibe,
        e.direccion_entrega AS entrega_direccion_entrega,
        e.ciudad AS entrega_ciudad,
        e.estado_entrega AS entrega_estado_entrega,
        e.fecha_salida AS entrega_fecha_salida,
        e.fecha_entrega AS entrega_fecha_entrega,
        e.costo_envio AS entrega_costo_envio,
        e.observacion AS entrega_observacion,

        u.id_usuario AS usuario_id_usuario,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email

      FROM public.historial_entrega h
      LEFT JOIN public.entrega e
        ON h.id_entrega = e.id_entrega
      LEFT JOIN public.usuarios u
        ON h.id_usuario = u.id_usuario
      WHERE h.id_usuario = $1
    `;

    const params: any[] = [user.idusuario];

    if (estado) {
      query += ` AND h.estado_nuevo = $${params.length + 1}`;
      params.push(estado);
    }

    query += ` ORDER BY h.fecha_cambio DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    params.push(limit);
    params.push(offset);

    const { rows } = await sql(query, params);

    const data: HistorialEntrega[] = rows.map((row) => ({
      idHistorial: row.id_historial,
      idEntrega: row.id_entrega,
      estadoAnterior: row.estado_anterior,
      estadoNuevo: row.estado_nuevo,
      fechaCambio: row.fecha_cambio,
      idUsuario: row.id_usuario,
      comentario: row.comentario,
      fotoEvidencia: row.foto_evidencia,

      entrega: row.entrega_id_entrega
        ? {
            idEntrega: row.entrega_id_entrega,
            idPedido: row.entrega_id_pedido,
            idDomiciliario: row.entrega_id_domiciliario,
            nombreRecibe: row.entrega_nombre_recibe,
            direccionEntrega: row.entrega_direccion_entrega,
            ciudad: row.entrega_ciudad,
            estadoEntrega: row.entrega_estado_entrega,
            fechaSalida: row.entrega_fecha_salida,
            fechaEntrega: row.entrega_fecha_entrega,
            costoEnvio: row.entrega_costo_envio,
            observacion: row.entrega_observacion,
          }
        : null,

      usuario: row.usuario_id_usuario
        ? {
            idUsuario: row.usuario_id_usuario,
            nombre: row.usuario_nombre,
            email: row.usuario_email,
          }
        : null,
    }));

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM public.historial_entrega
      WHERE id_usuario = $1
    `;

    const countParams: any[] = [user.idusuario];

    if (estado) {
      countQuery += ` AND estado_nuevo = $${countParams.length + 1}`;
      countParams.push(estado);
    }

    const { rows: countRows } = await sql<{ total: string }>(
      countQuery,
      countParams
    );

    const total = parseInt(countRows[0]?.total || "0");

    return NextResponse.json({
      ok: true,
      data,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/historial_entrega]", error);

    return NextResponse.json(
      { ok: false, error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}

// POST - Registrar cambio de estado de entrega
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession();

    if (!user?.idusuario) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      id_entrega,
      idEntrega,
      nombre_recibe,
      nombreRecibe,
      foto_evidencia,
      fotoEvidencia,
      observacion,
      comentario,
    } = body;

    const entregaId = id_entrega ?? idEntrega;
    const clienteNombreRecibe = nombre_recibe ?? nombreRecibe;
    const evidenciaFoto = foto_evidencia ?? fotoEvidencia;

    if (!entregaId) {
      return NextResponse.json(
        { ok: false, error: "id_entrega es requerido" },
        { status: 400 }
      );
    }

    const { rows: entregaRows } = await sql<{
      id_domiciliario: number;
      estado_entrega: string;
    }>(
      `
        SELECT
          id_domiciliario,
          estado_entrega
        FROM public.entrega
        WHERE id_entrega = $1
      `,
      [entregaId]
    );

    if (
      !entregaRows.length ||
      entregaRows[0].id_domiciliario !== user.idusuario
    ) {
      return NextResponse.json(
        { ok: false, error: "Esta entrega no pertenece a ti" },
        { status: 403 }
      );
    }

    const estado_anterior = entregaRows[0].estado_entrega;
    const estado_nuevo = "entregado";

    await sql(
      `
        INSERT INTO public.historial_entrega (
          id_entrega,
          estado_anterior,
          estado_nuevo,
          fecha_cambio,
          id_usuario,
          comentario,
          foto_evidencia
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6)
      `,
      [
        entregaId,
        estado_anterior,
        estado_nuevo,
        user.idusuario,
        comentario || null,
        evidenciaFoto || null,
      ]
    );

    await sql(
      `
        UPDATE public.entrega
        SET
          nombre_recibe = COALESCE($2, nombre_recibe),
          observacion = COALESCE($3, observacion),
          estado_entrega = $4,
          fecha_entrega = CURRENT_TIMESTAMP
        WHERE id_entrega = $1
      `,
      [
        entregaId,
        clienteNombreRecibe || null,
        observacion || null,
        estado_nuevo,
      ]
    );

    return NextResponse.json({
      ok: true,
      message: "Entrega registrada exitosamente",
    });
  } catch (error) {
    console.error("[POST /api/historial_entrega]", error);

    return NextResponse.json(
      { ok: false, error: "Error al registrar entrega" },
      { status: 500 }
    );
  }
}