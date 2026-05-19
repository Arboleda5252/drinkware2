"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const normalizeStatus = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "_") : "";

const getStatusLabel = (value: string | null) => {
  const normalized = normalizeStatus(value);

  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    asignada: "Asignada",
    asignado: "Asignada",
    en_camino: "En camino",
    entregado: "Entregado",
    no_entregado: "No entregado",
    cancelado: "Cancelado",
    pagado: "Pagado",
    rechazado: "Rechazado",
    reembolsado: "Reembolsado",
  };

  return labels[normalized] ?? (value ?? "Pendiente");
};

const getStatusClass = (value: string | null) => {
  const normalized = normalizeStatus(value);

  const styles: Record<string, string> = {
    pendiente: "border border-amber-300/30 bg-amber-400/15 text-amber-100",
    asignada: "border border-sky-300/30 bg-sky-400/15 text-sky-100",
    asignado: "border border-sky-300/30 bg-sky-400/15 text-sky-100",
    en_camino: "border border-blue-300/30 bg-blue-400/15 text-blue-100",
    entregado: "border border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
    no_entregado: "border border-rose-300/30 bg-rose-400/15 text-rose-100",
    cancelado: "border border-slate-400/30 bg-slate-400/15 text-slate-100",
    pagado: "border border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
    rechazado: "border border-rose-300/30 bg-rose-400/15 text-rose-100",
    reembolsado: "border border-violet-300/30 bg-violet-400/15 text-violet-100",
  };

  return styles[normalized] ?? "border border-slate-400/20 bg-slate-400/10 text-slate-100";
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

function InfoCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
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
        ] = await Promise.all([
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

        if (cancelled) return;

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

  const productosMap = useMemo(
    () => new Map<number, Producto>(productos.map((producto) => [Number(producto.id), producto])),
    [productos]
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-300 shadow-[0_18px_50px_rgba(2,6,23,0.2)]">
          Cargando detalle del pedido...
        </div>
      </main>
    );
  }

  if (error || !pedido || !entrega) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-[2rem] border border-rose-400/25 bg-rose-500/10 p-6 text-rose-100 shadow-[0_18px_50px_rgba(2,6,23,0.2)]">
          {error ?? "No se encontro la informacion del pedido."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#c9a55c]/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.92))] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] sm:p-10">
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#c9a55c]/16 blur-3xl" />
        <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-sky-400/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.18),transparent_24%)]" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-[#c9a55c]/35 bg-[#c9a55c]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#f5deb3]">
              Control de ruta
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Detalle de la entrega
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Informacion operativa del pedido, estado de entrega, cobro y productos asignados.
            </p>
          </div>

          <Link
            href="/user/domiciliario"
            className="rounded-full border border-[#c9a55c]/35 bg-[linear-gradient(135deg,#d2ac67,#9f7b32)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Volver a mis entregas
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Entrega</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Persona que recibe" value={entrega.nombreRecibe ?? "No registrada"} />
              <InfoCard label="Telefono" value={entrega.telefonoContacto ?? "No registrado"} />
              <InfoCard
                label="Direccion"
                value={entrega.direccionEntrega ?? "No registrada"}
                className="sm:col-span-2"
              />
              <InfoCard label="Ciudad" value={entrega.ciudad ?? "No registrada"} />
              <InfoCard label="Fecha de asignacion" value={formatDate(entrega.fechaAsignacion)} />
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Pago</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Metodo de pago" value={pago?.metodoPago ?? "No disponible"} />
              <InfoCard label="Estado de pago" value={getStatusLabel(pago?.estadoPago ?? null)} />
            </div>

            {isContraentrega(pago?.metodoPago ?? null) ? (
              <div className="mt-4 rounded-[1.5rem] border border-amber-300/25 bg-amber-400/10 p-4 text-amber-100">
                <p className="text-sm font-semibold">Cobro pendiente al entregar</p>
                <p className="mt-1 text-sm text-amber-50/90">
                  Este pedido es contraentrega. Debes cobrar al cliente al momento de entregar.
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Detalle de productos</h2>
            <div className="mt-5 space-y-4">
              {detalles.length > 0 ? (
                detalles.map((item) => (
                  <div
                    key={item.idDetallePedido}
                    className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.82))] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {productosMap.get(Number(item.idProducto))?.nombre ?? `Producto #${item.idProducto}`}
                        </p>
                        <p className="text-sm text-slate-400">Cantidad: {item.cantidad}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#f2d79a]">
                        {formatoCOP.format(item.subtotal ?? item.cantidad * item.precioUnitario)}
                      </p>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">
                      Precio unidad: {formatoCOP.format(item.precioUnitario)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-300">No hay detalles de productos disponibles.</p>
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

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Resumen de costos</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatoCOP.format(pedido.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Costo envio</span>
                <span>{formatoCOP.format(pedido.costoEnvio)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                <span>Total</span>
                <span className="text-[#f2d79a]">{formatoCOP.format(pedido.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Historial de entrega</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">Creacion</p>
                <p className="mt-1">{formatDate(pedido.fechaCreacion)}</p>
              </div>

              {historial.length > 0 ? (
                historial.map((item) => (
                  <div key={item.idHistorial} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-semibold text-white">
                      {item.estadoAnterior ? `${getStatusLabel(item.estadoAnterior)} -> ` : ""}
                      {getStatusLabel(item.estadoNuevo)}
                    </p>
                    <p className="mt-1 text-slate-400">{formatDate(item.fechaCambio)}</p>
                    {item.comentario ? <p className="mt-2 text-slate-300">{item.comentario}</p> : null}
                  </div>
                ))
              ) : (
                <p>No hay movimientos de historial registrados para esta entrega.</p>
              )}
            </div>
          </div>

          {pedido.observacion || entrega.observacion || pago?.observacion ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white">Observaciones</h2>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
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
