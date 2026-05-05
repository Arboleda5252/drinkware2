import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { getUserFromSession } from "@/app/Datalibs/auth";

export const runtime = "nodejs";

type EntregaConDetalles = {
  idEntrega: number;
  idPedido: number;
  idDomiciliario: number | null;
  nombreRecibe: string | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  estadoEntrega: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  fotoEvidencia: string | null;
  costoEnvio: string;
  observacion: string | null;
};

// GET - Obtener historial de entregas del domiciliario
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user?.id_usuario) {
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
        e.id_entrega AS "idEntrega",
        e.id_pedido AS "idPedido",
        e.id_domiciliario AS "idDomiciliario",
        e.nombre_recibe AS "nombreRecibe",
        e.direccion_entrega AS "direccionEntrega",
        e.ciudad,
        e.estado_entrega AS "estadoEntrega",
        e.fecha_salida AS "fechaSalida",
        e.fecha_entrega AS "fechaEntrega",
        e.foto_evidencia AS "fotoEvidencia",
        e.costo_envio AS "costoEnvio",
        e.observacion
      FROM public.entrega e
      WHERE e.id_domiciliario = $1
    `;

    const params: any[] = [user.id_usuario];

    if (estado) {
      query += ` AND e.estado_entrega = $${params.length + 1}`;
      params.push(estado);
    }

    query += ` ORDER BY e.fecha_entrega DESC, e.fecha_salida DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit);
    params.push(offset);

    const { rows } = await sql<EntregaConDetalles>(query, params);

    // Obtener contador total
    let countQuery = `SELECT COUNT(*) as total FROM public.entrega WHERE id_domiciliario = $1`;
    const countParams: any[] = [user.id_usuario];

    if (estado) {
      countQuery += ` AND estado_entrega = $${countParams.length + 1}`;
      countParams.push(estado);
    }

    const { rows: countRows } = await sql<{ total: string }>(
      countQuery,
      countParams
    );
    const total = parseInt(countRows[0]?.total || "0");

    return NextResponse.json({
      ok: true,
      data: rows,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/entregas-historial]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}

// POST - Actualizar entrega con foto de evidencia
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user?.id_usuario) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { idEntrega, nombreRecibe, fotoEvidencia, observacion } = body;

    if (!idEntrega) {
      return NextResponse.json(
        { ok: false, error: "idEntrega es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la entrega pertenezca al domiciliario
    const { rows: entregaRows } = await sql<{ id_domiciliario: number }>(
      `SELECT id_domiciliario FROM public.entrega WHERE id_entrega = $1`,
      [idEntrega]
    );

    if (!entregaRows.length || entregaRows[0].id_domiciliario !== user.id_usuario) {
      return NextResponse.json(
        { ok: false, error: "Esta entrega no pertenece a ti" },
        { status: 403 }
      );
    }

    // Actualizar entrega
    await sql(
      `
        UPDATE public.entrega
        SET
          nombre_recibe = COALESCE($2, nombre_recibe),
          foto_evidencia = COALESCE($3, foto_evidencia),
          observacion = COALESCE($4, observacion),
          estado_entrega = 'entregado',
          fecha_entrega = CURRENT_TIMESTAMP
        WHERE id_entrega = $1
      `,
      [idEntrega, nombreRecibe || null, fotoEvidencia || null, observacion || null]
    );

    return NextResponse.json({
      ok: true,
      message: "Entrega registrada exitosamente",
    });
  } catch (error) {
    console.error("[POST /api/entregas-historial]", error);
    return NextResponse.json(
      { ok: false, error: "Error al registrar entrega" },
      { status: 500 }
    );
  }
}
