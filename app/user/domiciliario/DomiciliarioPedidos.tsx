"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type EntregaAsignada = {
  idEntrega: number;
  idPedido: number;
  idDomiciliario: number | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  nombreRecibe: string | null;
  estadoEntrega: string | null;
  fechaAsignacion: string | null;
  fechaCancelado?: string | null;
  observacion: string | null;
};

type Domiciliario = {
  idDomiciliario: number;
  idUsuario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
};

type DomiciliarioPedidosProps = {
  currentUserId: number | null;
};

const statusStyles: Record<string, string> = {
  asignada: "border border-sky-300/30 bg-sky-400/15 text-sky-100",
  asignado: "border border-sky-300/30 bg-sky-400/15 text-sky-100",
  en_camino: "border border-blue-300/30 bg-blue-400/15 text-blue-100",
  no_entregado: "border border-amber-300/30 bg-amber-400/15 text-amber-100",
  cancelado: "border border-slate-400/30 bg-slate-400/15 text-slate-100",
};

function normalizeStatus(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "_") : "";
}

function getStatusLabel(status: string | null) {
  const normalized = normalizeStatus(status);

  const labels: Record<string, string> = {
    asignada: "Asignada",
    asignado: "Asignada",
    en_camino: "En camino",
    no_entregado: "No entregado",
    cancelado: "Cancelado",
  };

  return labels[normalized] ?? (status ?? "Sin estado");
}

function getStatusClass(status: string | null) {
  return statusStyles[normalizeStatus(status)] ?? "border border-slate-400/20 bg-slate-400/10 text-slate-100";
}

function formatDate(value: string | null | undefined) {
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
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-10 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
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

function PedidoCard({ entrega }: { entrega: EntregaAsignada }) {
  const normalizedStatus = normalizeStatus(entrega.estadoEntrega);
  const fechaPrincipal =
    normalizedStatus === "cancelado" ? entrega.fechaCancelado : entrega.fechaAsignacion;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.92))] shadow-[0_20px_60px_rgba(2,6,23,0.35)] transition duration-300 hover:-translate-y-1 hover:border-[#c9a55c]/30 hover:shadow-[0_30px_90px_rgba(2,6,23,0.55)]">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d1b06a]">Pedido asignado</p>
          <h3 className="text-lg font-semibold text-white">
            Pedido # {entrega.idPedido} para {entrega.nombreRecibe ?? "Entrega asignada"}
          </h3>
          <p className="text-sm text-slate-300">
            {entrega.direccionEntrega ?? "Direccion no registrada"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(entrega.estadoEntrega)}`}>
            {getStatusLabel(entrega.estadoEntrega)}
          </span>
          <Link
            href={`/user/domiciliario/pedidos/${entrega.idPedido}`}
            className="rounded-full border border-[#c9a55c]/35 bg-[linear-gradient(135deg,#d2ac67,#9f7b32)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Gestionar entrega
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/[0.03] px-6 py-5 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Ciudad</p>
            <p className="text-sm text-slate-300">{entrega.ciudad ?? "No registrada"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Telefono</p>
            <p className="text-sm text-slate-300">{entrega.telefonoContacto ?? "No registrado"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {normalizedStatus === "cancelado" ? "Fecha de cancelacion" : "Fecha de asignacion"}
            </p>
            <p className="text-sm text-slate-300">{formatDate(fechaPrincipal)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function DomiciliarioPedidos({ currentUserId }: DomiciliarioPedidosProps) {
  const [entregas, setEntregas] = useState<EntregaAsignada[]>([]);
  const [domiciliario, setDomiciliario] = useState<Domiciliario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadPedidos = useCallback(async () => {
    if (!currentUserId) {
      setEntregas([]);
      setDomiciliario(null);
      setError("No se pudo identificar el usuario del domiciliario.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [domiciliariosResponse, entregasResponse] = await Promise.all([
        fetch("/api/domiciliario", {
          cache: "no-store",
          credentials: "same-origin",
        }),
        fetch("/api/entrega", {
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);

      const domiciliariosJson = await domiciliariosResponse.json();
      const entregasJson = await entregasResponse.json();

      if (!domiciliariosResponse.ok || !domiciliariosJson?.ok) {
        throw new Error(
          domiciliariosJson?.error ?? "No se pudo cargar la informacion del domiciliario."
        );
      }

      if (!entregasResponse.ok || !entregasJson?.ok) {
        throw new Error(entregasJson?.error ?? "No se pudo cargar la lista de entregas.");
      }

      const domiciliarioActual = (domiciliariosJson.data as Domiciliario[]).find(
        (item) => Number(item.idUsuario) === currentUserId
      );

      if (!domiciliarioActual) {
        setEntregas([]);
        setDomiciliario(null);
        setError("No existe un registro de domiciliario asociado a este usuario.");
        return;
      }

      const entregasAsignadas = (entregasJson.data as EntregaAsignada[]).filter(
        (item) => Number(item.idDomiciliario) === Number(domiciliarioActual.idDomiciliario)
      );

      setDomiciliario(domiciliarioActual);
      setEntregas(entregasAsignadas);
      setLastUpdated(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Error al actualizar los pedidos asignados."
      );
      setEntregas([]);
      setDomiciliario(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadPedidos();
    const interval = window.setInterval(() => {
      void loadPedidos();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [loadPedidos]);

  const entregasVisibles = useMemo(
    () =>
      entregas.filter((item) =>
        ["asignada", "asignado", "en_camino", "no_entregado"].includes(
          normalizeStatus(item.estadoEntrega)
        )
      ),
    [entregas]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Tus pedidos asignados</h2>
            {domiciliario ? (
              <p className="mt-2 text-sm text-slate-300">
                Estado laboral: {domiciliario.estadoLaboral} | Disponibilidad: {domiciliario.disponibilidadManual}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="text-sm text-slate-300">
              {lastUpdated ? `Ultima actualizacion: ${lastUpdated}` : "Actualizando..."}
            </span>
            <button
              type="button"
              onClick={() => void loadPedidos()}
              className="inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/15 px-4 py-2 text-sm font-semibold text-sky-50 transition hover:bg-sky-400/25"
            >
              Actualizar pedidos
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="rounded-[1.75rem] border border-rose-400/25 bg-rose-500/10 p-6 text-rose-100 shadow-[0_18px_50px_rgba(2,6,23,0.2)]">
          {error}
        </div>
      ) : entregasVisibles.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-10 text-center text-slate-300 shadow-[0_18px_50px_rgba(2,6,23,0.2)]">
          <p className="text-xl font-semibold text-white">No tienes pedidos visibles en este panel</p>
          <p className="mt-3 text-sm text-slate-300">Revisa nuevamente en unos minutos</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {entregasVisibles.map((entrega) => (
            <PedidoCard
              key={`${entrega.idEntrega}-${entrega.estadoEntrega ?? "sin-estado"}`}
              entrega={entrega}
            />
          ))}
        </div>
      )}
    </section>
  );
}
