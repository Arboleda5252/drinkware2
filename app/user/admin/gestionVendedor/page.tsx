"use client";

import * as React from "react";
import { FaSpinner } from "react-icons/fa";

type Vendedor = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  documento: string | null;
  estado: boolean;
  fechaIngreso: string | null;
};

type Pedido = {
  idPedido: number;
  idVendedor: number | null;
  fechaCreacion: string;
  estadoPedido: string | null;
  total: number;
};

type Pago = {
  idPago: number;
  idPedido: number;
  estadoPago: string;
  metodoPago: string;
};

type PedidoResumen = {
  idPedido: number;
  fechaCreacion: string;
  estadoPedido: string | null;
  total: number;
  estadoPago: string;
  metodoPago: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GestionVendedorPage() {
  const [vendedores, setVendedores] = React.useState<Vendedor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [query, setQuery] = React.useState("");
  const [modalVendedor, setModalVendedor] = React.useState<Vendedor | null>(null);
  const [pedidosVendedor, setPedidosVendedor] = React.useState<PedidoResumen[]>([]);
  const [loadingPedidos, setLoadingPedidos] = React.useState(false);
  const [errorPedidos, setErrorPedidos] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/vendedores", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setVendedores(json.data as Vendedor[]);
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Error al cargar vendedores");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const vendedoresFiltrados = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return vendedores;
    }

    return vendedores.filter((vendedor) =>
      [
        vendedor.nombre ?? "",
        vendedor.apellido ?? "",
        vendedor.correo ?? "",
        vendedor.documento ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query, vendedores]);

  const handleToggle = async (vendedor: Vendedor) => {
    setSavingId(vendedor.id);
    setError(null);

    try {
      const res = await fetch(`/api/vendedores/${vendedor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: !vendedor.estado }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      setVendedores((prev) =>
        prev.map((item) =>
          item.id === vendedor.id ? { ...item, estado: json.data.estado as boolean } : item
        )
      );
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Error al actualizar vendedor");
    } finally {
      setSavingId(null);
    }
  };

  const closeModalPedidos = () => {
    setModalVendedor(null);
    setPedidosVendedor([]);
    setErrorPedidos(null);
    setLoadingPedidos(false);
  };

  const openModalPedidos = async (vendedor: Vendedor) => {
    setModalVendedor(vendedor);
    setPedidosVendedor([]);
    setErrorPedidos(null);
    setLoadingPedidos(true);

    try {
      const [pedidosRes, pagosRes] = await Promise.all([
        fetch("/api/pedidos", { cache: "no-store" }),
        fetch("/api/pago", { cache: "no-store" }),
      ]);

      const [pedidosJson, pagosJson] = await Promise.all([pedidosRes.json(), pagosRes.json()]);

      if (!pedidosRes.ok || !pedidosJson?.ok) {
        throw new Error(pedidosJson?.error ?? `HTTP ${pedidosRes.status}`);
      }
      if (!pagosRes.ok || !pagosJson?.ok) {
        throw new Error(pagosJson?.error ?? `HTTP ${pagosRes.status}`);
      }

      const pedidos = pedidosJson.data as Pedido[];
      const pagos = pagosJson.data as Pago[];
      const pagosMap = new Map<number, Pago>();
      for (const pago of pagos) {
        if (!pagosMap.has(pago.idPedido)) {
          pagosMap.set(pago.idPedido, pago);
        }
      }

      const resumen = pedidos
        .filter((pedido) => pedido.idVendedor === vendedor.id)
        .map((pedido) => {
          const pago = pagosMap.get(pedido.idPedido);
          return {
            idPedido: pedido.idPedido,
            fechaCreacion: pedido.fechaCreacion,
            estadoPedido: pedido.estadoPedido,
            total: pedido.total,
            estadoPago: pago?.estadoPago ?? "Sin pago",
            metodoPago: pago?.metodoPago ?? "-",
          };
        })
        .sort((a, b) => {
          const dateA = Date.parse(a.fechaCreacion);
          const dateB = Date.parse(b.fechaCreacion);
          return Number.isNaN(dateB) || Number.isNaN(dateA) ? b.idPedido - a.idPedido : dateB - dateA;
        });

      setPedidosVendedor(resumen);
    } catch (pedidosError: unknown) {
      setErrorPedidos(pedidosError instanceof Error ? pedidosError.message : "Error al cargar pedidos");
    } finally {
      setLoadingPedidos(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-8 text-white">
      <header className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Gestion de vendedores
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
          Consulta el estado de cada vendedor, administra su actividad y controla la visibilidad de sus modulos sin afectar las ventas registradas.
        </p>
      </header>

      {modalVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <button
              onClick={closeModalPedidos}
              className="absolute right-5 top-5 text-white/45 transition hover:text-white"
            >
              X
            </button>

            <div className="border-b border-white/10 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Pedidos del vendedor
              </p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight">
                {[modalVendedor.nombre, modalVendedor.apellido].filter(Boolean).join(" ") || "Vendedor"}
              </h2>
              <p className="mt-2 text-center text-sm text-white/65">
                Documento: {modalVendedor.documento ?? "-"} · Correo: {modalVendedor.correo ?? "-"}
              </p>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-6 sm:px-8">
              {loadingPedidos && (
                <div className="py-10 text-center text-white/65">
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-xl text-sky-200" />
                    <span>Cargando pedidos del vendedor...</span>
                  </div>
                </div>
              )}

              {!loadingPedidos && errorPedidos && (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
                  {errorPedidos}
                </div>
              )}

              {!loadingPedidos && !errorPedidos && pedidosVendedor.length > 0 && (
                <div className="space-y-3">
                  {pedidosVendedor.map((pedido) => (
                    <div
                      key={pedido.idPedido}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">Pedido #{pedido.idPedido}</p>
                          <p className="mt-1 text-sm text-white/60">
                            Fecha: {formatDate(pedido.fechaCreacion)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-white/60">Total</p>
                          <p className="text-lg font-semibold text-white">
                            ${pedido.total.toLocaleString("es-CO")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                          {pedido.estadoPedido ?? "Sin estado"}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            pedido.estadoPago.toLowerCase() === "pagado"
                              ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                              : "border border-amber-300/20 bg-amber-400/10 text-amber-100"
                          }`}
                        >
                          {pedido.estadoPago}
                        </span>
                        <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                          {pedido.metodoPago}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingPedidos && !errorPedidos && pedidosVendedor.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/60">
                  Este vendedor aun no tiene pedidos registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-5">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/45">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/45 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-white/65">
              <tr>
                <th className="px-6 py-3 font-semibold">Nombre</th>
                <th className="px-6 py-3 font-semibold">Correo</th>
                <th className="px-6 py-3 font-semibold">Documento</th>
                <th className="px-6 py-3 font-semibold">Fecha de ingreso</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 text-center font-semibold">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white/85">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-white/65">
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin text-xl text-sky-200" />
                      <span>Cargando vendedores...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                vendedoresFiltrados.map((vendedor) => (
                  <tr key={vendedor.id} className="transition hover:bg-white/6">
                    <td className="px-6 py-4">
                      {[vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-white/70">{vendedor.correo ?? "-"}</td>
                    <td className="px-6 py-4 text-white/70">{vendedor.documento ?? "-"}</td>
                    <td className="px-6 py-4 text-white/70">{formatDate(vendedor.fechaIngreso)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          vendedor.estado
                            ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                            : "border border-rose-300/20 bg-rose-400/10 text-rose-100"
                        }`}
                      >
                        {vendedor.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModalPedidos(vendedor)}
                          className="rounded-2xl border border-white/10 bg-sky-400/10 px-4 py-2 font-semibold text-sky-100 transition hover:bg-sky-400/20"
                        >
                          Ver ventas
                        </button>
                        <button
                          onClick={() => handleToggle(vendedor)}
                          disabled={savingId === vendedor.id}
                          className={`rounded-2xl px-4 py-2 font-semibold transition disabled:opacity-60 ${
                            vendedor.estado
                              ? "border border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20"
                              : "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20"
                          }`}
                        >
                          {savingId === vendedor.id
                            ? "Guardando..."
                            : vendedor.estado
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && vendedoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-white/60">
                    No hay vendedores que coincidan con la busqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
