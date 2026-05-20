"use client";

import { useEffect, useMemo, useState } from "react";

type HistorialEntrega = {
  idHistorial: number;
  idEntrega: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  comentario: string | null;
};

type Entrega = {
  idEntrega: number;
  idPedido: number;
  idDomiciliario: number | null;
  nombreRecibe: string | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  estadoEntrega: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  fechaCancelado: string | null;
  costoEnvio: number;
  observacion: string | null;
};

type HistorialConEntrega = HistorialEntrega & {
  entrega: Entrega | null;
};

const estadoFiltroOptions = [
  "todos",
  "asignada",
  "en_camino",
  "entregado",
  "no_entregado",
  "cancelado",
] as const;

type EstadoFiltro = (typeof estadoFiltroOptions)[number];

function normalizeEstado(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "_") : "";
}

function getEstadoLabel(value: string | null | undefined) {
  const normalized = normalizeEstado(value);

  const labels: Record<string, string> = {
    asignada: "Asignada",
    en_camino: "En camino",
    entregado: "Entregado",
    no_entregado: "No entregado",
    cancelado: "Cancelado",
    pendiente: "Pendiente",
  };

  return labels[normalized] ?? (value?.trim() || "Sin estado");
}

function getEstadoBadgeClass(value: string | null | undefined) {
  const normalized = normalizeEstado(value);

  const styles: Record<string, string> = {
    asignada: "border border-sky-300/30 bg-sky-400/15 text-sky-100",
    en_camino: "border border-blue-300/30 bg-blue-400/15 text-blue-100",
    entregado: "border border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
    no_entregado: "border border-amber-300/30 bg-amber-400/15 text-amber-100",
    cancelado: "border border-rose-300/30 bg-rose-400/15 text-rose-100",
    pendiente: "border border-slate-300/20 bg-slate-400/10 text-slate-100",
  };

  return styles[normalized] ?? "border border-slate-300/20 bg-slate-400/10 text-slate-100";
}

function getFilterButtonClass(active: boolean) {
  if (active) {
    return "border-[#c9a55c]/35 bg-[linear-gradient(135deg,#d2ac67,#9f7b32)] text-slate-950 shadow-[0_14px_34px_rgba(201,165,92,0.24)]";
  }

  return "border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-300/25 hover:bg-sky-400/10";
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-12 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
      <svg
        className="size-8 animate-spin text-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

export default function HistorialEntregasClient() {
  const [historialEntregas, setHistorialEntregas] = useState<HistorialConEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  useEffect(() => {
    let cancelled = false;

    const fetchHistorial = async () => {
      try {
        setLoading(true);

        const usuarioEstadoRes = await fetch("/api/usuarioEstado", { cache: "no-store" });
        const usuarioEstadoJson = await usuarioEstadoRes.json();
        if (!usuarioEstadoRes.ok || !usuarioEstadoJson?.ok) {
          throw new Error(usuarioEstadoJson?.error ?? `HTTP ${usuarioEstadoRes.status}`);
        }

        const user = usuarioEstadoJson.user ?? null;
        if (!user || !user.idusuario) {
          if (!cancelled) setHistorialEntregas([]);
          return;
        }

        const domiciliariosRes = await fetch("/api/domiciliario", { cache: "no-store" });
        const domiciliariosJson = await domiciliariosRes.json();
        if (!domiciliariosRes.ok || !domiciliariosJson?.ok) {
          throw new Error(domiciliariosJson?.error ?? `HTTP ${domiciliariosRes.status}`);
        }

        const domiciliarios: Array<{ idDomiciliario: number; idUsuario: number }> = domiciliariosJson.data ?? [];
        const domiciliario = domiciliarios.find((d) => Number(d.idUsuario) === Number(user.idusuario));
        if (!domiciliario) {
          if (!cancelled) setHistorialEntregas([]);
          return;
        }

        const entregasRes = await fetch("/api/entrega", { cache: "no-store" });
        const entregasJson = await entregasRes.json();
        if (!entregasRes.ok || !entregasJson?.ok) {
          throw new Error(entregasJson?.error ?? `HTTP ${entregasRes.status}`);
        }

        const entregas: Entrega[] = (entregasJson.data ?? []) as Entrega[];
        const entregasFiltradas = entregas
          .filter((e) => e.idDomiciliario !== null && Number(e.idDomiciliario) === Number(domiciliario.idDomiciliario))
          .sort((a, b) => {
            const ta = a.fechaAsignacion ? Date.parse(a.fechaAsignacion) : 0;
            const tb = b.fechaAsignacion ? Date.parse(b.fechaAsignacion) : 0;
            return tb - ta;
          });

        const historialConEntrega: HistorialConEntrega[] = entregasFiltradas.map((entrega, idx) => ({
          idHistorial: idx + 1,
          idEntrega: entrega.idEntrega,
          estadoAnterior: null,
          estadoNuevo: entrega.estadoEntrega ?? "",
          fechaCambio:
            entrega.fechaAsignacion ??
            entrega.fechaSalida ??
            entrega.fechaEntrega ??
            new Date().toISOString(),
          comentario: entrega.observacion ?? null,
          entrega,
        }));

        if (!cancelled) {
          setHistorialEntregas(historialConEntrega);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
        if (!cancelled) {
          setHistorialEntregas([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchHistorial();

    return () => {
      cancelled = true;
    };
  }, []);

  const historialFiltrado = useMemo(() => {
    if (estadoFiltro === "todos") return historialEntregas;

    return historialEntregas.filter(
      (historial) => normalizeEstado(historial.estadoNuevo) === estadoFiltro
    );
  }, [estadoFiltro, historialEntregas]);

  const resumen = useMemo(() => {
    const counters = {
      total: historialEntregas.length,
      entregadas: 0,
      enCamino: 0,
      incidencias: 0,
    };

    for (const item of historialEntregas) {
      const estado = normalizeEstado(item.estadoNuevo);

      if (estado === "entregado") counters.entregadas += 1;
      if (estado === "en_camino") counters.enCamino += 1;
      if (estado === "no_entregado" || estado === "cancelado") counters.incidencias += 1;
    }

    return counters;
  }, [historialEntregas]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#c9a55c]/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.92))] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] sm:p-10">
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#c9a55c]/16 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-sky-400/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_22%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.18),transparent_24%)]" />

        <div className="relative z-10">
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Historial de entregas
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Aqui veras el historial de cambios de estado de cada pedido asignado al flujo de entregas.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-[#c9a55c]/20 bg-[#c9a55c]/[0.08] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-[#e1c98f]">Registros</p>
              <p className="mt-3 text-3xl font-semibold text-white">{resumen.total}</p>
              <p className="mt-2 text-sm text-slate-300">Movimientos visibles</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-300/20 bg-sky-400/[0.08] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">En ruta</p>
              <p className="mt-3 text-3xl font-semibold text-white">{resumen.enCamino}</p>
              <p className="mt-2 text-sm text-slate-300">Entregas activas</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/[0.08] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">Completadas</p>
              <p className="mt-3 text-3xl font-semibold text-white">{resumen.entregadas}</p>
              <p className="mt-2 text-sm text-slate-300">Pedidos entregados</p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-400/[0.08] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-200">Incidencias</p>
              <p className="mt-3 text-3xl font-semibold text-white">{resumen.incidencias}</p>
              <p className="mt-2 text-sm text-slate-300">No entregados o cancelados</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-white">Filtrar por estado registrado</h2>
        <div className="flex flex-wrap gap-3">
          {estadoFiltroOptions.map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setEstadoFiltro(estado)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${getFilterButtonClass(
                estadoFiltro === estado
              )}`}
            >
              {estado === "todos" ? "Todos" : getEstadoLabel(estado)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : historialFiltrado.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-12 text-center shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
          <p className="text-lg text-slate-200">No hay movimientos en esta categoria.</p>
          <p className="mt-2 text-sm text-slate-400">
            Los cambios de estado de las entregas apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historialFiltrado.map((historial) => (
            <article
              key={historial.idHistorial}
              className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.92))] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Num. Referencia Pedido #{historial.entrega?.idPedido ?? "-"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {historial.entrega?.nombreRecibe || "Entrega registrada"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {historial.entrega?.direccionEntrega
                      ? `${historial.entrega.direccionEntrega}, ${historial.entrega.ciudad ?? ""}`
                      : "Direccion de entrega no disponible"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {historial.estadoAnterior ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                      {getEstadoLabel(historial.estadoAnterior)}
                    </span>
                  ) : null}
                  <span className="text-sm text-slate-500">{"->"}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getEstadoBadgeClass(
                      historial.estadoNuevo
                    )}`}
                  >
                    {getEstadoLabel(historial.estadoNuevo)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="font-medium text-slate-100">Fecha de asignacion</p>
                    <p className="mt-1">{formatDate(historial.entrega?.fechaAsignacion ?? null)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!historial.entrega?.idPedido) return;
                    window.location.href = `/user/domiciliario/pedidos/${historial.entrega.idPedido}`;
                  }}
                  className="rounded-full border border-sky-200/30 bg-[linear-gradient(135deg,#38bdf8,#1d4ed8)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:brightness-110"
                >
                  Ver pedido
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
