"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PedidoEstadoActions from "../PedidoEstadoActions";

type Props = {
  pedidoId: number;
  currentUserId: number;
};

type Pedido = {
  idPedido: number;
  idCliente: number | null;
  idVendedor: number | null;
  fechaCreacion: string;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  observacion: string | null;
  subtotal: number;
  costoEnvio: number;
  total: number;
};

type DetallePedido = {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number | null;
};

type Domiciliario = {
  idDomiciliario: number;
  idUsuario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
  observaciones: string | null;
};

type Entrega = {
  idEntrega: number;
  idPedido: number;
  idDomiciliario: number | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  nombreRecibe: string | null;
  costoEnvio: number;
  estadoEntrega: string | null;
  fechaProgramada: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  fechaHoraRetiro: string | null;
  observacion: string | null;
};

type Pago = {
  idPago: number;
  idPedido: number;
  metodoPago: string;
  estadoPago: string;
  monto: number;
  fechaPago: string | null;
  referenciaPago: string | null;
  observacion: string | null;
};

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
};

type HistorialEntrega = {
  idHistorial: number;
  idEntrega: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  comentario: string | null;
  fotoEvidencia: string | null;
};

type ApiResponse<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
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

const isContraentrega = (value: string | null) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "") === "contraentrega";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Error consultando ${url}`);
  }

  return payload.data as T;
}

export default function PedidoDetalleClient({ pedidoId, currentUserId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [pago, setPago] = useState<Pago | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [historial, setHistorial] = useState<HistorialEntrega[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          pedidoData,
          detallesData,
          domiciliariosData,
          entregasData,
          pagosData,
          productosData,
          historialData,
        ] =
          await Promise.all([
            fetchJson<Pedido>(`/api/pedidos/${pedidoId}`),
            fetchJson<DetallePedido[]>("/api/detalle_pedido"),
            fetchJson<Domiciliario[]>("/api/domiciliario"),
            fetchJson<Entrega[]>("/api/entrega"),
            fetchJson<Pago[]>("/api/pago"),
            fetchJson<Producto[]>("/api/productos"),
            fetchJson<HistorialEntrega[]>("/api/historial_entrega"),
          ]);

        const domiciliarioActual = domiciliariosData.find(
          (item) => Number(item.idUsuario) === currentUserId
        );

        if (!domiciliarioActual) {
          throw new Error("No existe un registro de domiciliario para este usuario.");
        }

        const entregaPedido = entregasData.find(
          (item) =>
            Number(item.idPedido) === pedidoId &&
            Number(item.idDomiciliario) === Number(domiciliarioActual.idDomiciliario)
        );

        if (!entregaPedido) {
          throw new Error("La entrega asociada a este pedido no existe o no te fue asignada.");
        }

        const pagoPedido =
          pagosData
            .filter((item) => Number(item.idPedido) === pedidoId)
            .sort((a, b) => b.idPago - a.idPago)[0] ?? null;

        const detallesPedido = detallesData.filter(
          (item) => Number(item.idPedido) === pedidoId
        );

        if (cancelled) {
          return;
        }

        setPedido(pedidoData);
        setEntrega(entregaPedido);
        setPago(pagoPedido);
        setDetalles(detallesPedido);
        setProductos(productosData);
        setHistorial(
          historialData
            .filter((item) => Number(item.idEntrega) === Number(entregaPedido.idEntrega))
            .sort(
              (left, right) =>
                new Date(right.fechaCambio).getTime() - new Date(left.fechaCambio).getTime()
            )
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el detalle del pedido."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [pedidoId, currentUserId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          Cargando detalle del pedido...
        </div>
      </main>
    );
  }

  if (error || !pedido || !entrega) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm shadow-rose-100">
          {error ?? "No se encontro la informacion del pedido."}
        </div>
      </main>
    );
  }

  const productosMap = new Map<number, Producto>(
    productos.map((producto) => [Number(producto.id), producto])
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Detalle de la entrega</h1>
          <p className="mt-2 text-sm text-slate-600">
            Informacion de la entrega, pago y detalle de productos.
          </p>
          <p className="text-sm text-slate-500"># Referencia de Pedido: {pedido.idPedido}</p>
        </div>
        <Link
          href="/user/domiciliario"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Volver a mis entregas
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Entrega</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Persona que recibe</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{entrega.nombreRecibe ?? "No registrada"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Telefono</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{entrega.telefonoContacto ?? "No registrado"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-sm text-slate-500">Direccion</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{entrega.direccionEntrega ?? "No registrada"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Ciudad</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{entrega.ciudad ?? "No registrada"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha de asignacion</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(entrega.fechaAsignacion)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Pago</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Metodo de pago</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{pago?.metodoPago ?? "No disponible"}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado de pago</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{getStatusLabel(pago?.estadoPago ?? null)}</p>
              </div>
            </div>

            {isContraentrega(pago?.metodoPago ?? null) ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="text-sm font-semibold">Cobro pendiente al entregar</p>
                <p className="mt-1 text-sm">
                  Este pedido es contraentrega. Debes cobrar al cliente al momento de entregar.
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Detalle de productos</h2>
            <div className="mt-5 space-y-4">
              {detalles.length > 0 ? (
                detalles.map((item) => (
                  <div key={item.idDetallePedido} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {productosMap.get(Number(item.idProducto))?.nombre ?? `Producto #${item.idProducto}`}
                        </p>
                        <p className="text-sm text-slate-500">Cantidad: {item.cantidad}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatoCOP.format(item.subtotal ?? item.cantidad * item.precioUnitario)}
                      </p>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      Precio unidad: {formatoCOP.format(item.precioUnitario)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No hay detalles de productos disponibles.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <PedidoEstadoActions
            entregaId={entrega.idEntrega}
            pedidoId={pedido.idPedido}
            pagoId={pago?.idPago ?? null}
            metodoPago={pago?.metodoPago ?? null}
            estadoPagoActual={pago?.estadoPago ?? null}
            currentStatus={entrega.estadoEntrega}
          />

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Resumen de costos</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatoCOP.format(pedido.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Costo envio</span>
                <span>{formatoCOP.format(pedido.costoEnvio)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatoCOP.format(pedido.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-xl font-semibold text-slate-900">Historial de entrega</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-700">Creacion</p>
                <p>{formatDate(pedido.fechaCreacion)}</p>
              </div>

              {historial.length > 0 ? (
                historial.map((item) => (
                  <div key={item.idHistorial} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-700">
                      {item.estadoAnterior ? `${getStatusLabel(item.estadoAnterior)} -> ` : ""}
                      {getStatusLabel(item.estadoNuevo)}
                    </p>
                    <p className="mt-1">{formatDate(item.fechaCambio)}</p>
                    {item.comentario ? <p className="mt-2 text-slate-500">{item.comentario}</p> : null}
                  </div>
                ))
              ) : (
                <p>No hay movimientos de historial registrados para esta entrega.</p>
              )}
            </div>
          </div>

          {pedido.observacion || entrega.observacion || pago?.observacion ? (
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
              <h2 className="text-xl font-semibold text-slate-900">Observaciones</h2>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                {pedido.observacion ? <p>Pedido: {pedido.observacion}</p> : null}
                {entrega.observacion ? <p>Entrega: {entrega.observacion}</p> : null}
                {pago?.observacion ? <p>Pago: {pago.observacion}</p> : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
