"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PedidoAsignado = {
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

const estadoEntregaOrder = ["Pendiente", "Asignado", "En camino", "Entregado", "No entregado"] as const;

type EstadoEntrega = (typeof estadoEntregaOrder)[number];

const statusStyles = {
  pendiente: "bg-amber-100 text-amber-900",
  asignado: "bg-sky-100 text-sky-900",
  "en camino": "bg-sky-100 text-sky-900",
  entregado: "bg-emerald-100 text-emerald-900",
  "no entregado": "bg-rose-100 text-rose-900",
  cancelado: "bg-rose-100 text-rose-900",
  default: "bg-slate-100 text-slate-900",
};

const normalizeStatus = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const getStatusClass = (status: string | null) => {
  const normalized = normalizeStatus(status);
  if (normalized.includes("en camino")) return statusStyles["en camino"];
  if (normalized.includes("entregado")) return statusStyles.entregado;
  if (normalized.includes("no entregado")) return statusStyles["no entregado"];
  if (normalized.includes("asignado")) return statusStyles.asignado;
  if (normalized.includes("pendiente")) return statusStyles.pendiente;
  if (normalized.includes("cancelado")) return statusStyles.cancelado;
  return statusStyles.default;
};

const getStatusIndex = (status: string | null) => {
  const normalized = normalizeStatus(status);
  return estadoEntregaOrder.findIndex((item) => item.toLowerCase() === normalized);
};

const getStatusLabel = (status: string | null) => {
  const normalized = normalizeStatus(status);
  return estadoEntregaOrder.find((item) => item.toLowerCase() === normalized) ?? (status ?? "Pendiente");
};

type EntregaEstadoActionsProps = {
  entregaId: number;
  currentStatus: string | null;
  onStatusUpdated: (nextStatus: string) => void;
};

function EntregaEstadoActions({ entregaId, currentStatus, onStatusUpdated }: EntregaEstadoActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedCurrent = getStatusLabel(currentStatus);
  const currentIndex = getStatusIndex(normalizedCurrent);
  const nextStates =
    currentIndex === -1 || currentIndex === estadoEntregaOrder.length - 1
      ? []
      : [estadoEntregaOrder[currentIndex + 1]];

  const changeStatus = async (nextStatus: EstadoEntrega) => {
    setError(null);
    setMessage(null);
    if (!window.confirm(`¿Desea cambiar el estado a ${nextStatus}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/entrega/${entregaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoEntrega: nextStatus }),
      });
      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error ?? "No se pudo actualizar el estado.");
      }

      const updatedStatus = getStatusLabel(json.data?.estadoEntrega ?? nextStatus);
      onStatusUpdated(updatedStatus);
      setMessage(`Estado actualizado a ${updatedStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span>Estado actual:</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(normalizedCurrent)}`}>
          {normalizedCurrent}
        </span>
      </div>
      <div className="grid gap-3">
        {nextStates.length > 0 ? (
          nextStates.map((nextState) => (
            <button
              key={nextState}
              type="button"
              onClick={() => void changeStatus(nextState)}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cambiar a {nextState}
            </button>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
            El pedido ya está en su estado final.
          </div>
        )}
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

function PedidoCard({ pedido }: { pedido: PedidoAsignado }) {
  const [currentStatus, setCurrentStatus] = useState<string>(getStatusLabel(pedido.estadoEntrega || pedido.estadoPedido));

  useEffect(() => {
    setCurrentStatus(getStatusLabel(pedido.estadoEntrega || pedido.estadoPedido));
  }, [pedido.estadoEntrega, pedido.estadoPedido]);

  const cliente = [pedido.clienteNombre, pedido.clienteApellido].filter(Boolean).join(" ") || "Cliente no registrado";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm shadow-slate-200/50 transition hover:shadow-md">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Pedido #{pedido.idPedido}</p>
          <h3 className="text-lg font-semibold text-slate-900">{cliente}</h3>
          <p className="text-sm text-slate-600">{pedido.direccionEntrega ?? "Dirección no registrada"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(currentStatus)}`}>
            {currentStatus}
          </span>
          <span className="text-sm text-slate-500">{formatDate(pedido.fechaCreacion)}</span>
          <Link
            href={`/user/domiciliario/pedidos/${pedido.idPedido}`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver detalle
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Método de pago</p>
            <p className="text-sm text-slate-600">{pedido.metodoPago ?? "No disponible"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Estado de pago</p>
            <p className="text-sm text-slate-600">{pedido.estadoPago ?? "Pendiente"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Tipo de entrega</p>
            <p className="text-sm text-slate-600">{pedido.tipoEntrega ?? "Domicilio"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Fecha de asignación</p>
            <p className="text-sm text-slate-600">{formatDate(pedido.fechaAsignacion)}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Ciudad</p>
            <p className="text-sm text-slate-600">{pedido.ciudad ?? "No registrada"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Teléfono</p>
            <p className="text-sm text-slate-600">{pedido.telefonoContacto ?? "No registrado"}</p>
          </div>
        </div>
        <div className="mt-6">
          <EntregaEstadoActions
            entregaId={pedido.idEntrega}
            currentStatus={currentStatus}
            onStatusUpdated={setCurrentStatus}
          />
        </div>
      </div>
    </article>
  );
}

export default function DomiciliarioPedidos() {
  const [pedidos, setPedidos] = useState<PedidoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/domiciliario/pedidos", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = await response.json();

      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "No se pudo cargar la lista de pedidos.");
        setPedidos([]);
      } else {
        setPedidos(json.data ?? []);
        setLastUpdated(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (fetchError) {
      setError("Error al actualizar los pedidos asignados. Vuelve a intentar.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPedidos();
    const interval = window.setInterval(() => {
      loadPedidos();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadPedidos]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Tus pedidos asignados</h2>
            <p className="mt-2 text-sm text-slate-600">
              Aquí verás solo los pedidos que te han sido asignados como domiciliario.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="text-sm text-slate-500">
              {lastUpdated ? `Última actualización: ${lastUpdated}` : "Actualizando..."}
            </span>
            <button
              type="button"
              onClick={loadPedidos}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Refrescar ahora
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          Cargando pedidos asignados...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm shadow-rose-100">
          {error}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          <p className="text-xl font-semibold text-slate-900">No tienes pedidos asignados actualmente</p>
          <p className="mt-3 text-sm">Revisa nuevamente en unos minutos; los pedidos se actualizan automáticamente.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pedidos.map((pedido) => (
            <PedidoCard key={pedido.idEntrega} pedido={pedido} />
          ))}
        </div>
      )}
    </section>
  );
}