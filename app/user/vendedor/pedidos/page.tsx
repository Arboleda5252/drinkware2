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
const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const getCustomerName = (item: PedidoEnriquecido) =>
  item.entrega.nombreRecibe?.trim() ||
  [item.cliente?.nombre, item.cliente?.apellido].filter(Boolean).join(" ").trim() ||
  "Cliente no identificado";

const isRetiro = (item: PedidoEnriquecido) => normalize(item.pedido.tipoEntrega) === "retiro_tienda";

const getEstadoPago = (pagos: Pago[]) => pagos[0]?.estadoPago ?? "Sin pago";

const Eye = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function VendedorPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoEnriquecido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<PedidoEnriquecido | null>(null);

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
      const [pedidosRaw, entregasRaw, detallesRaw, pagosRaw, usuariosRaw, productosRaw] =
        await Promise.all([
          fetchJson<Pedido[]>("/api/pedidos"),
          fetchJson<Entrega[]>("/api/entrega"),
          fetchJson<DetallePedido[]>("/api/detalle_pedido"),
          fetchJson<Pago[]>("/api/pago"),
          fetchJson<Usuario[]>("/api/usuarios"),
          fetchJson<Producto[]>("/api/productos"),
        ]);

      const usuariosMap = new Map<number, Usuario>(
        usuariosRaw.map((usuario) => [Number(usuario.id), usuario])
      );
      const productosMap = new Map<number, Producto>(
        productosRaw.map((producto) => [Number(producto.id), producto])
      );
      const pagosPorPedido = new Map<number, Pago[]>();

      pagosRaw.forEach((pago) => {
        const pedidoId = Number(pago.idPedido);
        const actuales = pagosPorPedido.get(pedidoId) ?? [];
        actuales.push(pago);
        pagosPorPedido.set(pedidoId, actuales.sort((a, b) => b.idPago - a.idPago));
      });

      const detallesPorPedido = new Map<number, DetallePedido[]>();
      detallesRaw.forEach((detalle) => {
        const pedidoId = Number(detalle.idPedido);
        const actuales = detallesPorPedido.get(pedidoId) ?? [];
        actuales.push(detalle);
        detallesPorPedido.set(pedidoId, actuales);
      });

      const pedidosPendientes = entregasRaw
        .map((entrega) => {
          const pedido = pedidosRaw.find(
            (item) => Number(item.idPedido) === Number(entrega.idPedido)
          );
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
            cliente: pedido.idCliente
              ? usuariosMap.get(Number(pedido.idCliente)) ?? null
              : null,
            detalles,
            pagos: pagosPorPedido.get(pedido.idPedido) ?? [],
          };
        })
        .filter((pedido): pedido is PedidoEnriquecido => pedido !== null)
        .sort((a, b) => {
          const retiroOrder = Number(isRetiro(b)) - Number(isRetiro(a));
          if (retiroOrder !== 0) {
            return retiroOrder;
          }
          return (
            new Date(b.pedido.fechaCreacion).getTime() -
            new Date(a.pedido.fechaCreacion).getTime()
          );
        });

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

    return pedidos.filter((item) => {
      const haystack = [
        getCustomerName(item),
        item.entrega.nombreRecibe,
        item.cliente?.documento,
        item.pedido.idPedido.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [pedidos, search]);

  const retiroCount = useMemo(
    () => pedidosFiltrados.filter((item) => isRetiro(item)).length,
    [pedidosFiltrados]
  );

  const domicilioCount = useMemo(
    () => pedidosFiltrados.filter((item) => !isRetiro(item)).length,
    [pedidosFiltrados]
  );

  const actualizarRetiro = useCallback(
    async (pedido: PedidoEnriquecido, action: "confirm" | "reject") => {
      setSubmittingId(pedido.pedido.idPedido);
      setFeedback(null);

      const estadoEntrega = action === "confirm" ? "Entregado" : "Rechazado";
      const estadoPedido = action === "confirm" ? "Entregado" : "Rechazado";
      const fechaEntrega = action === "confirm" ? new Date().toISOString() : null;
      const fechaPago = action === "confirm" ? new Date().toISOString() : null;

      try {
        const updates: Promise<unknown>[] = [
          fetchJson<Entrega>(`/api/entrega/${pedido.entrega.idEntrega}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estadoEntrega,
              fechaEntrega,
              observacion:
                action === "confirm"
                  ? "Entrega confirmada por vendedor en retiro en tienda"
                  : "Entrega cancelada por vendedor en retiro en tienda",
            }),
          }),
          fetchJson<Pedido>(`/api/pedidos/${pedido.pedido.idPedido}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estadoPedido,
            }),
          }),
        ];

        if (action === "confirm" && pedido.pagos.length > 0) {
          updates.push(
            ...pedido.pagos.map((pago) =>
              fetchJson<Pago>(`/api/pago/${pago.idPago}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  estadoPago: "Pagado",
                  fechaPago,
                  observacion: "Pago confirmado al entregar en tienda",
                }),
              })
            )
          );
        }

        await Promise.all(updates);

        setFeedback(
          action === "confirm"
            ? `Pedido #${pedido.pedido.idPedido} marcado como entregado.`
            : `Pedido #${pedido.pedido.idPedido} cancelado para retiro en tienda.`
        );
        setSelectedPedido(null);
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
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Gestion de pedidos
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Lista de pedidos
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Consulta pedidos pendientes, priorizando retiro en tienda, y revisa el detalle en un modal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Pedidos</p>
                <p className="text-2xl font-bold text-slate-900">{pedidosFiltrados.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Retiro en tienda</p>
                <p className="text-2xl font-bold text-slate-900">{retiroCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Domicilio</p>
                <p className="text-2xl font-bold text-slate-900">{domicilioCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o id de pedido..."
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
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No hay pedidos que coincidan con la busqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Tipo entrega</th>
                    <th className="px-4 py-3">Estado pedido</th>
                    <th className="px-4 py-3">Estado pago</th>
                    <th className="px-4 py-3">Creado</th>
                    <th className="px-4 py-3 text-right">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((item) => (
                    <tr
                      key={item.pedido.idPedido}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        #{item.pedido.idPedido}
                      </td>
                      <td className="px-4 py-4">{getCustomerName(item)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isRetiro(item)
                              ? "bg-sky-100 text-sky-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isRetiro(item) ? "Retiro en tienda" : "Domicilio"}
                        </span>
                      </td>
                      <td className="px-4 py-4">{item.pedido.estadoPedido ?? "Pendiente"}</td>
                      <td className="px-4 py-4">{getEstadoPago(item.pagos)}</td>
                      <td className="px-4 py-4">
                        {new Date(item.pedido.fechaCreacion).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPedido(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
                          aria-label={`Ver detalles del pedido ${item.pedido.idPedido}`}
                        >
                          <Eye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedPedido && (
        <PedidoDetalleModal
          pedido={selectedPedido}
          submitting={submittingId === selectedPedido.pedido.idPedido}
          onClose={() => setSelectedPedido(null)}
          onConfirm={() => void actualizarRetiro(selectedPedido, "confirm")}
          onReject={() => void actualizarRetiro(selectedPedido, "reject")}
        />
      )}
    </main>
  );
}

type PedidoDetalleModalProps = {
  pedido: PedidoEnriquecido;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
};

function PedidoDetalleModal({
  pedido,
  submitting,
  onClose,
  onConfirm,
  onReject,
}: PedidoDetalleModalProps) {
  const retiro = isRetiro(pedido);
  const customerName = getCustomerName(pedido);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
              Detalle del pedido
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            X
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <InfoCard label="Tipo entrega" value={retiro ? "Retiro en tienda" : "Domicilio"} />
          <InfoCard label="Estado pedido" value={pedido.pedido.estadoPedido ?? "Pendiente"} />
          <InfoCard label="Estado pago" value={getEstadoPago(pedido.pagos)} />
          <InfoCard label="Total" value={formatoCOP.format(pedido.pedido.total)} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <section className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Productos seleccionados</h3>
              <div className="mt-4 space-y-3">
                {pedido.detalles.length === 0 ? (
                  <p className="text-sm text-slate-500">Este pedido no tiene productos.</p>
                ) : (
                  pedido.detalles.map(({ detalle, producto }) => {
                    const subtotal =
                      detalle.subtotal ?? detalle.cantidad * detalle.precioUnitario;

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
                            Cantidad: {detalle.cantidad} | Precio unidad:{" "}
                            {formatoCOP.format(detalle.precioUnitario)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Categoria: {producto?.categoria ?? "Sin categoria"}
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
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Cliente y Entrega</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Nombre: {customerName}</p>
                <p>Documento: {pedido.cliente?.documento ?? "Sin documento"}</p>
                <p>Telefono: {pedido.entrega.telefonoContacto ?? "Sin telefono"}</p>
                {retiro ? (
                  <p>
                    Fecha de retiro:{" "}
                    {pedido.entrega.fechaHoraRetiro
                      ? new Date(pedido.entrega.fechaHoraRetiro).toLocaleString()
                      : "Pendiente"}
                  </p>
                ) : (
                  <>
                    <p>Direccion: {pedido.entrega.direccionEntrega ?? "Sin direccion"}</p>
                    <p>Ciudad: {pedido.entrega.ciudad ?? "Sin ciudad"}</p>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Pagos</h3>
              <div className="mt-4 space-y-3">
                {pedido.pagos.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin pagos registrados.</p>
                ) : (
                  pedido.pagos.map((pago) => (
                    <div key={pago.idPago} className="rounded-xl bg-white px-3 py-3 text-sm text-slate-600 ring-1 ring-black/5">
                      <p>Monto: {formatoCOP.format(pago.monto)}</p>
                      <p>Referencia: {pago.referenciaPago ?? "Sin referencia"}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {retiro && (
              <section className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">Acciones de retiro</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={submitting}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {submitting ? "Procesando..." : "Confirmar entrega"}
                  </button>
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={submitting}
                    className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
                  >
                    {submitting ? "Procesando..." : "Cancelar entrega"}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
};

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
