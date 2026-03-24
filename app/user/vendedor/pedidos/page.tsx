"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

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

type DetallePedido = {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number | null;
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

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  documento: string;
  nombreusuario: string;
  rol: string | null;
  activo: boolean;
};

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  descripcion: string | null;
  estados: string | null;
};

type PedidoEnriquecido = {
  pedido: Pedido;
  entrega: Entrega;
  cliente: Usuario | null;
  detalles: Array<{
    detalle: DetallePedido;
    producto: Producto | null;
  }>;
  pagos: Pago[];
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const placeholderImagen = "/no-image.png";
const estadosCerrados = new Set([
  "entregado",
  "rechazado",
  "cancelado",
  "cancelada",
  "completado",
  "completada",
]);

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export default function VendedorPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoEnriquecido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
    });
    const payload: { ok?: boolean; data?: T; error?: string } | null = await response
      .json()
      .catch(() => null);

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error ?? `Error ${response.status}`);
    }

    return payload.data as T;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pedidosRaw, entregasRaw, detallesRaw, pagosRaw, usuariosRaw, productosRaw] = await Promise.all([
        fetchJson<Pedido[]>("/api/pedidos"),
        fetchJson<Entrega[]>("/api/entrega"),
        fetchJson<DetallePedido[]>("/api/detalle_pedido"),
        fetchJson<Pago[]>("/api/pago"),
        fetchJson<Usuario[]>("/api/usuarios"),
        fetchJson<Producto[]>("/api/productos"),
      ]);

      const usuariosMap = new Map<number, Usuario>(usuariosRaw.map((usuario) => [Number(usuario.id), usuario]));
      const productosMap = new Map<number, Producto>(productosRaw.map((producto) => [Number(producto.id), producto]));
      const pagosPorPedido = new Map<number, Pago[]>();

      pagosRaw.forEach((pago) => {
        const pedidoId = Number(pago.idPedido);
        const actuales = pagosPorPedido.get(pedidoId) ?? [];
        actuales.push(pago);
        pagosPorPedido.set(pedidoId, actuales);
      });

      const detallesPorPedido = new Map<number, DetallePedido[]>();
      detallesRaw.forEach((detalle) => {
        const pedidoId = Number(detalle.idPedido);
        const actuales = detallesPorPedido.get(pedidoId) ?? [];
        actuales.push(detalle);
        detallesPorPedido.set(pedidoId, actuales);
      });

      const pedidosPendientes = entregasRaw
        .filter((entrega) => !estadosCerrados.has(normalize(entrega.estadoEntrega)))
        .map((entrega) => {
          const pedido = pedidosRaw.find((item) => Number(item.idPedido) === Number(entrega.idPedido));
          if (!pedido) {
            return null;
          }

          const detalles = (detallesPorPedido.get(pedido.idPedido) ?? []).map((detalle) => ({
            detalle,
            producto: productosMap.get(Number(detalle.idProducto)) ?? null,
          }));

          return {
            pedido,
            entrega,
            cliente: pedido.idCliente ? usuariosMap.get(Number(pedido.idCliente)) ?? null : null,
            detalles,
            pagos: (pagosPorPedido.get(pedido.idPedido) ?? []).sort((a, b) => b.idPago - a.idPago),
          };
        })
        .filter((pedido): pedido is PedidoEnriquecido => pedido !== null)
        .sort(
          (a, b) =>
            new Date(b.pedido.fechaCreacion).getTime() - new Date(a.pedido.fechaCreacion).getTime()
        );

      setPedidos(pedidosPendientes);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los pedidos pendientes."
      );
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pedidosFiltrados = useMemo(() => {
    const term = normalize(search);
    if (!term) {
      return pedidos;
    }

    return pedidos.filter(({ cliente, pedido, entrega, detalles, pagos }) => {
      const customerName = [cliente?.nombre, cliente?.apellido].filter(Boolean).join(" ");
      const haystack = [
        customerName,
        cliente?.documento,
        cliente?.nombreusuario,
        entrega.nombreRecibe,
        entrega.telefonoContacto,
        pedido.idPedido.toString(),
        ...detalles.map((item) => item.producto?.nombre ?? ""),
        ...pagos.map((pago) => `${pago.metodoPago} ${pago.estadoPago} ${pago.referenciaPago ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [pedidos, search]);

  const pedidosRetiro = useMemo(
    () => pedidosFiltrados.filter((item) => normalize(item.pedido.tipoEntrega) === "retiro_tienda"),
    [pedidosFiltrados]
  );
  const pedidosDomicilio = useMemo(
    () => pedidosFiltrados.filter((item) => normalize(item.pedido.tipoEntrega) !== "retiro_tienda"),
    [pedidosFiltrados]
  );

  const actualizarRetiro = useCallback(
    async (pedido: PedidoEnriquecido, action: "confirm" | "reject") => {
      setSubmittingId(pedido.pedido.idPedido);
      setFeedback(null);

      const estadoEntrega = action === "confirm" ? "Entregado" : "Rechazado";
      const estadoPedido = action === "confirm" ? "Entregado" : "Rechazado";
      const fechaEntrega = action === "confirm" ? new Date().toISOString() : null;

      try {
        await Promise.all([
          fetchJson<Entrega>(`/api/entrega/${pedido.entrega.idEntrega}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estadoEntrega,
              fechaEntrega,
              observacion:
                action === "confirm"
                  ? "Entrega confirmada por vendedor en retiro en tienda"
                  : "Entrega rechazada por vendedor en retiro en tienda",
            }),
          }),
          fetchJson<Pedido>(`/api/pedidos/${pedido.pedido.idPedido}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estadoPedido,
            }),
          }),
        ]);

        setFeedback(
          action === "confirm"
            ? `Pedido #${pedido.pedido.idPedido} marcado como entregado.`
            : `Pedido #${pedido.pedido.idPedido} marcado como rechazado.`
        );
        await loadData();
      } catch (updateError) {
        setFeedback(
          updateError instanceof Error
            ? updateError.message
            : "No se pudo actualizar el estado del retiro."
        );
      } finally {
        setSubmittingId(null);
      }
    },
    [fetchJson, loadData]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Gestion de pedidos
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Entregas pendientes
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Revisa retiros en tienda y domicilios pendientes, con detalle de cliente, productos y pagos.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-bold text-slate-900">{pedidosFiltrados.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Retiro en tienda</p>
                <p className="text-2xl font-bold text-slate-900">{pedidosRetiro.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Domicilio</p>
                <p className="text-2xl font-bold text-slate-900">{pedidosDomicilio.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, documento, producto o pedido..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {feedback && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {feedback}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
              />
            ))}
          </div>
        ) : (
          <>
            <SeccionPedidos
              title="Retiro en tienda"
              description="Pedidos listos para ser entregados o rechazados en mostrador."
              pedidos={pedidosRetiro}
              emptyMessage="No hay retiros en tienda pendientes."
              submittingId={submittingId}
              onConfirm={(pedido) => void actualizarRetiro(pedido, "confirm")}
              onReject={(pedido) => void actualizarRetiro(pedido, "reject")}
            />

            <SeccionPedidos
              title="Domicilio"
              description="Pedidos con entrega a domicilio pendientes de seguimiento."
              pedidos={pedidosDomicilio}
              emptyMessage="No hay domicilios pendientes."
              submittingId={submittingId}
            />
          </>
        )}
      </div>
    </main>
  );
}

type SeccionPedidosProps = {
  title: string;
  description: string;
  pedidos: PedidoEnriquecido[];
  emptyMessage: string;
  submittingId: number | null;
  onConfirm?: (pedido: PedidoEnriquecido) => void;
  onReject?: (pedido: PedidoEnriquecido) => void;
};

function SeccionPedidos({
  title,
  description,
  pedidos,
  emptyMessage,
  submittingId,
  onConfirm,
  onReject,
}: SeccionPedidosProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-sm text-slate-500">Pedidos</p>
          <p className="text-xl font-bold text-slate-900">{pedidos.length}</p>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-5">
          {pedidos.map((item) => {
            const customerName =
              [item.cliente?.nombre, item.cliente?.apellido].filter(Boolean).join(" ") ||
              item.entrega.nombreRecibe ||
              "Cliente no identificado";
            const isRetiro = normalize(item.pedido.tipoEntrega) === "retiro_tienda";
            const isSubmitting = submittingId === item.pedido.idPedido;

            return (
              <article
                key={item.pedido.idPedido}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/70"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        Pedido #{item.pedido.idPedido}
                      </h3>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                        {isRetiro ? "Retiro en tienda" : "Domicilio"}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {item.entrega.estadoEntrega ?? "Pendiente"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Creado el {new Date(item.pedido.fechaCreacion).toLocaleString()}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-slate-800">{customerName}</p>
                      <p>Documento: {item.cliente?.documento ?? "Sin documento"}</p>
                      <p>Usuario: {item.cliente?.nombreusuario ?? "No registrado"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p>Telefono: {item.entrega.telefonoContacto ?? "Sin telefono"}</p>
                      <p>
                        {isRetiro
                          ? `Retiro: ${
                              item.entrega.fechaHoraRetiro
                                ? new Date(item.entrega.fechaHoraRetiro).toLocaleString()
                                : "Pendiente"
                            }`
                          : `Direccion: ${item.entrega.direccionEntrega ?? "Sin direccion"}`}
                      </p>
                      {!isRetiro && <p>Ciudad: {item.entrega.ciudad ?? "Sin ciudad"}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 px-6 py-5 xl:grid-cols-[1.4fr_0.8fr]">
                  <div className="space-y-4">
                    {item.detalles.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                        Este pedido no tiene detalles de producto.
                      </div>
                    ) : (
                      item.detalles.map(({ detalle, producto }) => {
                        const subtotal = detalle.subtotal ?? detalle.cantidad * detalle.precioUnitario;

                        return (
                          <div
                            key={detalle.idDetallePedido}
                            className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:flex-row"
                          >
                            <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-3">
                              <Image
                                src={producto?.imagen ?? placeholderImagen}
                                alt={producto?.nombre ?? "Producto"}
                                width={96}
                                height={96}
                                className="h-24 w-24 object-contain"
                              />
                            </div>

                            <div className="flex-1">
                              <p className="text-lg font-semibold text-slate-900">
                                {producto?.nombre ?? `Producto #${detalle.idProducto}`}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Categoria: {producto?.categoria ?? "Sin categoria"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Cantidad: {detalle.cantidad} | Precio unidad: {formatoCOP.format(detalle.precioUnitario)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Estado producto: {producto?.estados ?? "Sin estado"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-slate-500">Subtotal</p>
                              <p className="text-xl font-bold text-slate-900">
                                {formatoCOP.format(subtotal)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                      <p className="text-sm font-semibold text-slate-800">Pagos</p>
                      {item.pagos.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Sin pagos registrados.</p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {item.pagos.map((pago) => (
                            <div key={pago.idPago} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                              <p className="font-semibold text-slate-800">
                                {pago.metodoPago} | {pago.estadoPago}
                              </p>
                              <p>Monto: {formatoCOP.format(pago.monto)}</p>
                              <p>Referencia: {pago.referenciaPago ?? "Sin referencia"}</p>
                              <p>
                                Fecha: {pago.fechaPago ? new Date(pago.fechaPago).toLocaleString() : "Pendiente"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                      <p className="text-sm font-semibold text-slate-800">Resumen</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>Subtotal: {formatoCOP.format(item.pedido.subtotal)}</p>
                        <p>Costo envio: {formatoCOP.format(item.pedido.costoEnvio)}</p>
                        <p>Estado pedido: {item.pedido.estadoPedido ?? "Pendiente"}</p>
                        <p className="pt-2 text-lg font-bold text-slate-900">
                          Total: {formatoCOP.format(item.pedido.total)}
                        </p>
                      </div>
                    </div>

                    {isRetiro && onConfirm && onReject && (
                      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                        <p className="text-sm font-semibold text-slate-800">Acciones de retiro</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => onConfirm(item)}
                            disabled={isSubmitting}
                            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                          >
                            {isSubmitting ? "Procesando..." : "Confirmar entrega"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(item)}
                            disabled={isSubmitting}
                            className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
                          >
                            {isSubmitting ? "Procesando..." : "Rechazar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
