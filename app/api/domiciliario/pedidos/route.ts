import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { getUserFromSession } from "@/app/Datalibs/auth";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

type PedidoAsignadoRow = {
  idEntrega: number;
  idPedido: number;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  estadoEntrega: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  fechaCreacion: string | null;
  observacion: string | null;
  clienteNombre: string | null;
  clienteApellido: string | null;
  metodoPago: string | null;
  estadoPago: string | null;
  fechaPago: string | null;
};

const toDto = (row: PedidoAsignadoRow) => ({
  idEntrega: Number(row.idEntrega),
  idPedido: Number(row.idPedido),
  direccionEntrega: row.direccionEntrega,
  ciudad: row.ciudad,
  telefonoContacto: row.telefonoContacto,
  estadoEntrega: row.estadoEntrega,
  fechaAsignacion: row.fechaAsignacion,
  fechaSalida: row.fechaSalida,
  fechaEntrega: row.fechaEntrega,
  tipoEntrega: row.tipoEntrega,
  estadoPedido: row.estadoPedido,
  fechaCreacion: row.fechaCreacion,
  observacion: row.observacion,
  clienteNombre: row.clienteNombre,
  clienteApellido: row.clienteApellido,
  metodoPago: row.metodoPago,
  estadoPago: row.estadoPago,
  fechaPago: row.fechaPago,
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getUserFromSession();
    if (!sessionUser?.idusuario) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    if ((sessionUser.rol ?? "").toLowerCase() !== "domiciliario") {
      return NextResponse.json(
        { ok: false, error: "Acceso restringido a domiciliarios" },
        { status: 403 }
      );
    }

    const { rows } = await sql<PedidoAsignadoRow>(
      `
        SELECT
          e.id_entrega AS "idEntrega",
          e.id_pedido AS "idPedido",
          e.direccion_entrega AS "direccionEntrega",
          e.ciudad,
          e.telefono_contacto AS "telefonoContacto",
          e.estado_entrega AS "estadoEntrega",
          e.fecha_asignacion AS "fechaAsignacion",
          e.fecha_salida AS "fechaSalida",
          e.fecha_entrega AS "fechaEntrega",
          p.tipo_entrega AS "tipoEntrega",
          p.estado_pedido AS "estadoPedido",
          p.fecha_creacion AS "fechaCreacion",
          p.observacion AS "observacion",
          u.nombre AS "clienteNombre",
          u.apellido AS "clienteApellido",
          pay.metodo_pago AS "metodoPago",
          pay.estado_pago AS "estadoPago",
          pay.fecha_pago AS "fechaPago"
        FROM public.entrega AS e
        JOIN public.pedido AS p ON p.id_pedido = e.id_pedido
        LEFT JOIN public.usuario AS u ON u.idusuario = p.id_cliente
        LEFT JOIN LATERAL (
          SELECT metodo_pago, estado_pago, fecha_pago
          FROM public.pago
          WHERE id_pedido = p.id_pedido
          ORDER BY id_pago DESC
          LIMIT 1
        ) AS pay ON true
        WHERE e.id_domiciliario = $1
        ORDER BY e.fecha_asignacion DESC, e.id_entrega DESC;
      `,
      [sessionUser.idusuario]
    );

    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/domiciliario/pedidos]", error);
    const message =
      error instanceof DatabaseError
        ? error.detail || error.message
        : "Error al listar pedidos asignados";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
