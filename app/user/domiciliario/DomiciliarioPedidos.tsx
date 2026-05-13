"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type EntregaAsignada = {
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

type Domiciliario = {
  idDomiciliario: number;
  idUsuario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
  observaciones: string | null;
};

type DomiciliarioPedidosProps = {
  currentUserId: number | null;
};

const estadoEntregaOrder = ["Pendiente", "Asignado", "En camino", "Entregado", "No entregado"] as const;

type EstadoEntrega = (typeof estadoEntregaOrder)[number];

const statusStyles = {
  pendiente: "bg-amber-100 text-amber-900",
  asignado: "bg-sky-100 text-sky-900",
  "en camino": "bg-sky-100 text-sky-900",
  entregado: "bg-emerald-100 text-emerald-900",
  "no entregado": "bg-rose-100 text-rose-900",
  default: "bg-slate-100 text-slate-900",
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

const normalizeStatus = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const getStatusClass = (status: string | null) => {
  const normalized = normalizeStatus(status);
  if (normalized.includes("en camino")) return statusStyles["en camino"];
  if (normalized.includes("no entregado")) return statusStyles["no entregado"];
  if (normalized.includes("entregado")) return statusStyles.entregado;
  if (normalized.includes("asignado")) return statusStyles.asignado;
  if (normalized.includes("pendiente")) return statusStyles.pendiente;
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

const getTipoEntregaLabel = (entrega: EntregaAsignada) =>
  entrega.fechaHoraRetiro ? "Retiro en tienda" : "Domicilio";

type EntregaEstadoActionsProps = {
  entregaId: number;
  currentStatus: string | null;
  onStatusUpdated: (nextStatus: string) => void;
};

function EntregaEstadoActions({
  entregaId,
  currentStatus,
  onStatusUpdated,
}: EntregaEstadoActionsProps) {
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

    if (!window.confirm(`Desea cambiar el estado a ${nextStatus}?`)) {
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
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Error al actualizar el estado."
      );
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
            La entrega ya esta en su estado final.
          </div>
        )}
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

function PedidoCard({ entrega }: { entrega: EntregaAsignada }) {
  const [currentStatus, setCurrentStatus] = useState<string>(getStatusLabel(entrega.estadoEntrega));

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm shadow-slate-200/50 transition hover:shadow-md">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Pedido #{entrega.idPedido}</p>
          <h3 className="text-lg font-semibold text-slate-900">
            {entrega.nombreRecibe ?? "Entrega asignada"}
          </h3>
          <p className="text-sm text-slate-600">
            {entrega.direccionEntrega ?? "Direccion no registrada"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(currentStatus)}`}>
            {currentStatus}
          </span>
          <Link
            href={`/user/domiciliario/pedidos/${entrega.idPedido}`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver detalle
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Persona</p>
            <p className="text-sm text-slate-600">{entrega.nombreRecibe ?? "No registrado"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Direccion</p>
            <p className="text-sm text-slate-600">{entrega.direccionEntrega ?? "No registrada"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Telefono</p>
            <p className="text-sm text-slate-600">{entrega.telefonoContacto ?? "No registrado"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Ciudad</p>
            <p className="text-sm text-slate-600">{entrega.ciudad ?? "No registrada"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-700">Tipo de entrega</p>
            <p className="text-sm text-slate-600">{getTipoEntregaLabel(entrega)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Fecha de asignacion</p>
            <p className="text-sm text-slate-600">{formatDate(entrega.fechaAsignacion)}</p>
          </div>
        </div>

        {entrega.observacion ? (
          <div className="mt-6 rounded-2xl bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Observaciones</p>
            <p className="mt-2 text-sm text-slate-600">{entrega.observacion}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <EntregaEstadoActions
            entregaId={entrega.idEntrega}
            currentStatus={currentStatus}
            onStatusUpdated={setCurrentStatus}
          />
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

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Tus pedidos asignados</h2>
            <p className="mt-2 text-sm text-slate-600">
              Aqui veras las entregas asignadas a tu registro de domiciliario.
            </p>
            {domiciliario ? (
              <p className="mt-2 text-sm text-slate-500">
                Estado laboral: {domiciliario.estadoLaboral} | Disponibilidad: {domiciliario.disponibilidadManual}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="text-sm text-slate-500">
              {lastUpdated ? `Ultima actualizacion: ${lastUpdated}` : "Actualizando..."}
            </span>
            <button
              type="button"
              onClick={() => void loadPedidos()}
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
      ) : entregas.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          <p className="text-xl font-semibold text-slate-900">No tienes pedidos asignados actualmente</p>
          <p className="mt-3 text-sm">Revisa nuevamente en unos minutos; las entregas se actualizan automaticamente.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {entregas.map((entrega) => (
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
