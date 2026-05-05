import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/app/Datalibs/database";
import { getUserFromSession } from "@/app/Datalibs/auth";
import PedidoEstadoActions from "./PedidoEstadoActions";

export const metadata = { title: "Detalle del pedido" };

type Params = { params: { pedidoId: string } };

type PedidoDetalleRow = {
  idPedido: number;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  fechaCreacion: string | null;
  subtotal: number | string;
  costoEnvio: number | string;
  total: number | string;
  observacion: string | null;
  clienteNombre: string | null;
  clienteApellido: string | null;
  clienteEmail: string | null;
  idEntrega: number;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  estadoEntrega: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  observacionEntrega: string | null;
  metodoPago: string | null;
  estadoPago: string | null;
  fechaPago: string | null;
  idDetallePedido: number | null;
  idProducto: number | null;
  cantidad: number | null;
  precioUnitario: number | string | null;
  detalleSubtotal: number | string | null;
  productoNombre: string | null;
  productoDescripcion: string | null;
};

type PedidoConDetalle = {
  idPedido: number;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  fechaCreacion: string | null;
  subtotal: number;
  costoEnvio: number;
  total: number;
  observacion: string | null;
  clienteNombre: string | null;
  clienteApellido: string | null;
  clienteEmail: string | null;
  idEntrega: number;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  estadoEntrega: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  observacionEntrega: string | null;
  metodoPago: string | null;
  estadoPago: string | null;
  fechaPago: string | null;
  detalles: Array<{
    idDetallePedido: number;
    idProducto: number | null;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    productoNombre: string | null;
    productoDescripcion: string | null;
  }>;
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatDate = (value: string | null) => {
  if (!value) return "Sin fecha";
  try {
    return new Date(value).toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const getStatusLabel = (value: string | null) => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "Pendiente";
  return normalized
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
};

async function loadPedidoDetalle(pedidoId: number, idDomiciliario: number) {
  const { rows } = await sql<PedidoDetalleRow>(
    `
      SELECT
        p.id_pedido AS "idPedido",
        p.tipo_entrega AS "tipoEntrega",
        p.estado_pedido AS "estadoPedido",
        p.fecha_creacion AS "fechaCreacion",
        p.subtotal,
        p.costo_envio AS "costoEnvio",
        p.total,
        p.observacion AS "observacion",
        u.nombre AS "clienteNombre",
        u.apellido AS "clienteApellido",
        u.email AS "clienteEmail",
        e.id_entrega AS "idEntrega",
        e.direccion_entrega AS "direccionEntrega",
        e.ciudad,
        e.telefono_contacto AS "telefonoContacto",
        e.estado_entrega AS "estadoEntrega",
        e.fecha_asignacion AS "fechaAsignacion",
        e.fecha_salida AS "fechaSalida",
        e.fecha_entrega AS "fechaEntrega",
        e.observacion AS "observacionEntrega",
        pay.metodo_pago AS "metodoPago",
        pay.estado_pago AS "estadoPago",
        pay.fecha_pago AS "fechaPago",
        dp.id_detalle_pedido AS "idDetallePedido",
        dp.id_producto AS "idProducto",
        dp.cantidad,
        dp.precio_unitario AS "precioUnitario",
        dp.subtotal AS "detalleSubtotal",
        prod.nombre AS "productoNombre",
        prod.descripcion AS "productoDescripcion"
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
      LEFT JOIN public.detalle_pedido AS dp ON dp.id_pedido = p.id_pedido
      LEFT JOIN public.producto AS prod ON prod.idproducto = dp.id_producto
      WHERE e.id_pedido = $1
        AND e.id_domiciliario = $2
      ORDER BY dp.id_detalle_pedido ASC;
    `,
    [pedidoId, idDomiciliario]
  );

  if (!rows.length) return null;

  const first = rows[0];

  return {
    idPedido: Number(first.idPedido),
    tipoEntrega: first.tipoEntrega,
    estadoPedido: first.estadoPedido,
    fechaCreacion: first.fechaCreacion,
    subtotal: Number(first.subtotal),
    costoEnvio: Number(first.costoEnvio),
    total: Number(first.total),
    observacion: first.observacion,
    clienteNombre: first.clienteNombre,
    clienteApellido: first.clienteApellido,
    clienteEmail: first.clienteEmail,
    idEntrega: Number(first.idEntrega),
    direccionEntrega: first.direccionEntrega,
    ciudad: first.ciudad,
    telefonoContacto: first.telefonoContacto,
    estadoEntrega: first.estadoEntrega,
    fechaAsignacion: first.fechaAsignacion,
    fechaSalida: first.fechaSalida,
    fechaEntrega: first.fechaEntrega,
    observacionEntrega: first.observacionEntrega,
    metodoPago: first.metodoPago,
    estadoPago: first.estadoPago,
    fechaPago: first.fechaPago,
    detalles: rows
      .filter((row) => row.idDetallePedido !== null)
      .map((row) => ({
        idDetallePedido: Number(row.idDetallePedido),
        idProducto: row.idProducto === null ? null : Number(row.idProducto),
        cantidad: Number(row.cantidad ?? 0),
        precioUnitario: Number(row.precioUnitario ?? 0),
        subtotal: Number(row.detalleSubtotal ?? (Number(row.precioUnitario ?? 0) * Number(row.cantidad ?? 0))),
        productoNombre: row.productoNombre,
        productoDescripcion: row.productoDescripcion,
      })),
  };
}

export default async function Page({ params }: Params) {
  const pedidoId = Number(params.pedidoId);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    notFound();
  }

  const sessionUser = await getUserFromSession();
  if (!sessionUser || sessionUser.idusuario <= 0) {
    notFound();
  }

  if ((sessionUser.rol ?? "").toLowerCase() !== "domiciliario") {
    notFound();
  }

  const pedido = await loadPedidoDetalle(pedidoId, sessionUser.idusuario);
  if (!pedido) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Detalle del pedido #{pedido.idPedido}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Información completa del pedido, estado de entrega y pago, y detalles de productos.
          </p>
        </div>
        <Link
          href="/user/domiciliario"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Volver a pedidos
        </Link>
      </div>

      {getStatusLabel(pedido.estadoEntrega).toLowerCase() === "entregado" ? (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm shadow-emerald-100">
          <p className="text-lg font-semibold">Entrega confirmada</p>
          <p className="mt-2 text-sm text-emerald-900">
            El pedido fue entregado correctamente el {formatDate(pedido.fechaEntrega)} y se ha marcado como Finalizado.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Resumen del pedido</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {pedido.clienteNombre ?? "Cliente"} {pedido.clienteApellido ?? ""}
                </p>
                {pedido.clienteEmail ? <p className="text-sm text-slate-500">{pedido.clienteEmail}</p> : null}
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado del pedido</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{getStatusLabel(pedido.estadoPedido)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado de la entrega</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{getStatusLabel(pedido.estadoEntrega)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Tipo de entrega</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{pedido.tipoEntrega ?? "Domicilio"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Dirección de entrega</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Direccion</p>
              <p>{pedido.direccionEntrega ?? "No registrada"}</p>
              <p className="font-semibold text-slate-700">Ciudad</p>
              <p>{pedido.ciudad ?? "No registrada"}</p>
              <p className="font-semibold text-slate-700">Teléfono</p>
              <p>{pedido.telefonoContacto ?? "No registrado"}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Detalles de pago</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Método</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{pedido.metodoPago ?? "No disponible"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{getStatusLabel(pedido.estadoPago)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha de pago</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(pedido.fechaPago)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Productos del pedido</h2>
            <div className="mt-5 space-y-4">
              {pedido.detalles.length > 0 ? (
                <div className="space-y-4">
                  {pedido.detalles.map((item) => (
                    <div key={item.idDetallePedido} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{item.productoNombre ?? "Producto"}</p>
                          <p className="text-sm text-slate-500">{item.productoDescripcion ?? "Sin descripción"}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{formatoCOP.format(item.subtotal)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>Cantidad: {item.cantidad}</span>
                        <span>Precio unidad: {formatoCOP.format(item.precioUnitario)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No hay detalles de productos disponibles.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <PedidoEstadoActions
            entregaId={pedido.idEntrega}
            currentStatus={pedido.estadoEntrega}
          />

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Resumen de costos</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatoCOP.format(pedido.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Costo envío</span>
                <span>{formatoCOP.format(pedido.costoEnvio)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatoCOP.format(pedido.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Fechas clave</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-700">Creación</p>
                <p>{formatDate(pedido.fechaCreacion)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Asignación</p>
                <p>{formatDate(pedido.fechaAsignacion)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Salida</p>
                <p>{formatDate(pedido.fechaSalida)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Entrega</p>
                <p>{formatDate(pedido.fechaEntrega)}</p>
              </div>
            </div>
          </div>

          {pedido.observacion ? (
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
              <h2 className="text-xl font-semibold text-slate-900">Observaciones</h2>
              <p className="mt-3 text-sm text-slate-600">{pedido.observacion}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
