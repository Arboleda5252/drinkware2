"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entregaId: number;
  currentStatus: string | null;
  onUpdated?: (newStatus: string) => void;
};

const estadoEntregaOrder = [
  "Pendiente",
  "Asignada",
  "En_camino",
  "Entregado",
  "No_entregado",
  "Cancelado",
] as const;

type EstadoEntrega = (typeof estadoEntregaOrder)[number];

const normalizeStatus = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "_") : "";

const getStatusIndex = (value: string | null | undefined) => {
  const normalized = normalizeStatus(value);
  return estadoEntregaOrder.findIndex(
    (item) => item.toLowerCase() === normalized
  );
};

const statusStyles = {
  pendiente: "bg-amber-100 text-amber-900",
  asignada: "bg-sky-100 text-sky-900",
  en_camino: "bg-sky-100 text-sky-900",
  entregado: "bg-emerald-100 text-emerald-900",
  no_entregado: "bg-rose-100 text-rose-900",
  cancelado: "bg-slate-200 text-slate-900",
  default: "bg-slate-100 text-slate-900",
};

const getStatusClass = (status: string | null) => {
  const normalized = normalizeStatus(status);
  return statusStyles[normalized as keyof typeof statusStyles] ?? statusStyles.default;
};

const getDisplayLabel = (status: string | null) => {
  if (!status) return "Pendiente";
  const canonical = estadoEntregaOrder.find(
    (item) => item.toLowerCase() === normalizeStatus(status)
  ) ?? status;

  const labels: Record<string, string> = {
    Pendiente: "Pendiente",
    Asignada: "Asignada",
    En_camino: "En camino",
    Entregado: "Entregado",
    No_entregado: "No entregado",
    Cancelado: "Cancelado",
  };

  return labels[canonical] ?? canonical;
};

export default function PedidoEstadoActions({
  entregaId,
  currentStatus,
  onUpdated,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(getDisplayLabel(currentStatus));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingState, setPendingState] = useState<EstadoEntrega | null>(null);
  const [observacion, setObservacion] = useState("");

  const currentIndex = useMemo(() => getStatusIndex(status), [status]);
  const nextStates = useMemo(() => {
    const normalized = normalizeStatus(status);

    if (normalized === "pendiente" || normalized === "entregado" || normalized === "cancelado") {
      return [];
    }

    if (normalized === "asignada") {
      return ["En_camino", "Cancelado"] as EstadoEntrega[];
    }

    if (normalized === "en_camino") {
      return ["Entregado", "No_entregado", "Cancelado"] as EstadoEntrega[];
    }

    if (normalized === "no_entregado") {
      return ["En_camino", "Cancelado"] as EstadoEntrega[];
    }

    if (currentIndex === -1 || currentIndex === estadoEntregaOrder.length - 1) {
      return [];
    }

    return [];
  }, [currentIndex, status]);

  const requiresObservation = useCallback(
    (nextState: EstadoEntrega) =>
      nextState === "No_entregado" || nextState === "Cancelado",
    []
  );

  const handleChangeStatus = useCallback(
    async (nextState: EstadoEntrega, observacionMotivo?: string) => {
      setError(null);
      setMessage(null);

      setLoading(true);
      try {
        const response = await fetch(`/api/entrega/${entregaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estadoEntrega: nextState,
            ...(observacionMotivo !== undefined
              ? { observacion: observacionMotivo.trim() || null }
              : {}),
          }),
        });

        const json = await response.json();
        if (!response.ok || !json?.ok) {
          throw new Error(json?.error ?? "No se pudo actualizar el estado.");
        }

        const updatedState = getDisplayLabel(json.data?.estadoEntrega ?? nextState);
        setStatus(updatedState);
        setMessage(`Estado actualizado a ${updatedState}.`);
        onUpdated?.(updatedState);
        router.refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cambiar el estado de entrega."
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [entregaId, onUpdated, router]
  );

  const openStatusChange = useCallback(
    (nextState: EstadoEntrega) => {
      setError(null);
      setMessage(null);

      if (requiresObservation(nextState)) {
        setPendingState(nextState);
        setObservacion("");
        return;
      }

      const confirmed = window.confirm(
        `Desea cambiar el estado a ${getDisplayLabel(nextState)}?`
      );
      if (!confirmed) return;

      void handleChangeStatus(nextState);
    },
    [handleChangeStatus, requiresObservation]
  );

  const submitPendingState = useCallback(async () => {
    if (!pendingState) return;

    const updated = await handleChangeStatus(pendingState, observacion);
    if (!updated) return;

    setPendingState(null);
    setObservacion("");
  }, [handleChangeStatus, observacion, pendingState]);

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Actualizar estado de entrega</h2>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-slate-500">Estado actual:</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
            {status}
          </span>
        </div>

        <div className="grid gap-3">
          {nextStates.length > 0 ? (
            nextStates.map((nextState) => (
              <button
                key={nextState}
                type="button"
                onClick={() => openStatusChange(nextState)}
                disabled={loading}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cambiar a {getDisplayLabel(nextState)}
              </button>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Esta entrega no tiene cambios de estado disponibles desde su estado actual.
            </div>
          )}
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {error}
          </div>
        ) : null}
      </div>

      {pendingState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Cambiar a {getDisplayLabel(pendingState)}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Puedes registrar una observacion sobre el motivo. Esta observacion se guardara en la entrega y en el historial.
            </p>

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Observacion del motivo
            </label>
            <textarea
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              rows={4}
              placeholder="Describe el motivo de no entrega o cancelacion"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={submitPendingState}
                disabled={loading}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar cambio
              </button>
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setPendingState(null);
                  setObservacion("");
                }}
                disabled={loading}
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
