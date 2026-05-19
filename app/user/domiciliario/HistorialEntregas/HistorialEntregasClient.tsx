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
    asignada: "bg-sky-100 text-sky-900",
    en_camino: "bg-cyan-100 text-cyan-900",
    entregado: "bg-emerald-100 text-emerald-900",
    no_entregado: "bg-rose-100 text-rose-900",
    cancelado: "bg-slate-200 text-slate-900",
    pendiente: "bg-amber-100 text-amber-900",
  };

  return styles[normalized] ?? "bg-slate-100 text-slate-900";
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

export default function HistorialEntregasClient() {
  const [historialEntregas, setHistorialEntregas] = useState<HistorialConEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  useEffect(() => {
    let cancelled = false;

    const fetchHistorial = async () => {
      try {
        setLoading(true);

        // Obtener usuario activo
        const usuarioEstadoRes = await fetch("/api/usuarioEstado", { cache: "no-store" });
        const usuarioEstadoJson = await usuarioEstadoRes.json();
        if (!usuarioEstadoRes.ok || !usuarioEstadoJson?.ok) {
          throw new Error(usuarioEstadoJson?.error ?? `HTTP ${usuarioEstadoRes.status}`);
        }

        const user = usuarioEstadoJson.user ?? null;
        if (!user || !user.idusuario) {
          // Usuario no autenticado o no activo -> no mostrar historial
          if (!cancelled) setHistorialEntregas([]);
          return;
        }

        // Obtener domiciliarios y buscar el que corresponde al usuario activo
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

        // Obtener solo entregas y filtrar por idDomiciliario
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

        // Construir un historial simple a partir de entregas (sin historial_entrega)
        const historialConEntrega: HistorialConEntrega[] = entregasFiltradas.map((entrega, idx) => ({
          idHistorial: idx + 1,
          idEntrega: entrega.idEntrega,
          estadoAnterior: null,
          estadoNuevo: entrega.estadoEntrega ?? "",
          fechaCambio: entrega.fechaAsignacion ?? entrega.fechaSalida ?? entrega.fechaEntrega ?? new Date().toISOString(),
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/50">
        <h1 className="text-3xl font-semibold text-slate-900">Historial de Entregas</h1>
        <p className="mt-3 text-sm text-slate-600">
          Aqui veras el historial de cambios de estado de cada pedido asignado al flujo de entregas.
        </p>
      </header>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Filtrar por estado registrado</h2>
        <div className="flex flex-wrap gap-2">
          {estadoFiltroOptions.map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setEstadoFiltro(estado)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                estadoFiltro === estado
                  ? "bg-sky-500 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {estado === "todos" ? "Todos" : getEstadoLabel(estado)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-500" />
            <p className="text-slate-600">Cargando historial...</p>
          </div>
        </div>
      ) : historialFiltrado.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-12 text-center shadow-sm shadow-slate-200/50">
          <p className="text-lg text-slate-600">No hay movimientos en esta categoria.</p>
          <p className="mt-2 text-sm text-slate-500">
            Los cambios de estado de las entregas apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historialFiltrado.map((historial) => (
            <article
              key={historial.idHistorial}
              className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Pedido #{historial.entrega?.idPedido ?? "-"} | Entrega #{historial.idEntrega}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {historial.entrega?.nombreRecibe || "Entrega registrada"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {historial.entrega?.direccionEntrega
                      ? `${historial.entrega.direccionEntrega}, ${historial.entrega.ciudad ?? ""}`
                      : "Direccion de entrega no disponible"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {historial.estadoAnterior ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {getEstadoLabel(historial.estadoAnterior)}
                    </span>
                  ) : null}
                  <span className="text-sm text-slate-400">→</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getEstadoBadgeClass(
                      historial.estadoNuevo
                    )}`}
                  >
                    {getEstadoLabel(historial.estadoNuevo)}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="font-medium text-slate-700">Fecha del cambio</p>
                  <p>{formatDate(historial.fechaCambio)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Estado actual de entrega</p>
                  <p>{getEstadoLabel(historial.entrega?.estadoEntrega)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Fecha de salida</p>
                  <p>{formatDate(historial.entrega?.fechaSalida ?? null)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Fecha de entrega</p>
                  <p>{formatDate(historial.entrega?.fechaEntrega ?? null)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <p className="font-medium text-slate-700">Comentario del historial</p>
                  <p>{historial.comentario || "Sin comentario"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Observacion de la entrega</p>
                  <p>{historial.entrega?.observacion || "Sin observacion"}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="font-medium text-slate-700">Costo de envio</p>
                    <p>{formatCurrency(Number(historial.entrega?.costoEnvio ?? 0))}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Fecha de asignacion</p>
                    <p>{formatDate(historial.entrega?.fechaAsignacion ?? null)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Fecha de cancelacion</p>
                    <p>{formatDate(historial.entrega?.fechaCancelado ?? null)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!historial.entrega?.idPedido) return;
                    window.location.href = `/user/domiciliario/pedidos/${historial.entrega.idPedido}`;
                  }}
                  className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  Ver pedido
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 
        Camara, captura de foto y evidencia fotografica deshabilitadas temporalmente.
        Este modulo quedo fuera del flujo actual porque la API de historial_entrega ya no
        trabaja con foto_evidencia ni con el modal de camara.
        Cuando se retome este frente, revisar juntos:
        1. Dónde debe persistirse la foto.
        2. Si la evidencia pertenece a entrega o a historial_entrega.
        3. Cómo versionar multiples evidencias por cambio de estado.
      */}
    </main>
  );
}
