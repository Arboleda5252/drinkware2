import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: { id: string } };

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
  observacion: row.observacion,
});

export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);

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