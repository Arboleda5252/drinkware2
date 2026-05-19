"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entregaId: number;
  pedidoId: number;
  pagoId?: number | null;
  metodoPago?: string | null;
  estadoPagoActual?: string | null;
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
  return estadoEntregaOrder.findIndex((item) => item.toLowerCase() === normalized);
};

const statusStyles = {
  pendiente: "border border-amber-300/30 bg-amber-400/15 text-amber-100",
  asignada: "border border-sky-300/30 bg-sky-400/15 text-sky-100",
  en_camino: "border border-blue-300/30 bg-blue-400/15 text-blue-100",
  entregado: "border border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
  no_entregado: "border border-rose-300/30 bg-rose-400/15 text-rose-100",
  cancelado: "border border-slate-400/30 bg-slate-400/15 text-slate-100",
  default: "border border-slate-400/20 bg-slate-400/10 text-slate-100",
};

const getStatusClass = (status: string | null) => {
  const normalized = normalizeStatus(status);
  return statusStyles[normalized as keyof typeof statusStyles] ?? statusStyles.default;
};

const getDisplayLabel = (status: string | null) => {
  if (!status) return "Pendiente";
  const canonical =
    estadoEntregaOrder.find((item) => item.toLowerCase() === normalizeStatus(status)) ?? status;

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

const isEstadoPagado = (value: string | null | undefined) =>
  normalizeStatus(value) === "pagado";

const isMetodoContraentrega = (value: string | null | undefined) =>
  normalizeStatus(value).includes("contraentrega");

const isMetodoTarjeta = (value: string | null | undefined) => {
  const normalized = normalizeStatus(value);
  return normalized === "tarjeta" || normalized === "stripe" || normalized === "pago_online";
};

export default function PedidoEstadoActions({
  entregaId,
  pedidoId,
  pagoId,
  metodoPago,
  estadoPagoActual,
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
    (nextState: EstadoEntrega) => nextState === "No_entregado" || nextState === "Cancelado",
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

        const updatedStateRaw = String(json.data?.estadoEntrega ?? nextState);
        const normalizedUpdatedState = normalizeStatus(updatedStateRaw);
        if (normalizedUpdatedState === "entregado" || normalizedUpdatedState === "cancelado") {
          const estadoPedido =
            normalizedUpdatedState === "cancelado" ? "Cancelado" : "Entregado";
          const pedidoResponse = await fetch(`/api/pedidos/${pedidoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estadoPedido }),
          });

          const pedidoJson = await pedidoResponse.json().catch(() => null);
          if (!pedidoResponse.ok || !pedidoJson?.ok) {
            throw new Error(
              pedidoJson?.error ?? "La entrega se actualizo, pero no se pudo sincronizar el estado del pedido."
            );
          }
        }

        if (pagoId) {
          let siguienteEstadoPago: string | null = null;

          if (normalizedUpdatedState === "entregado" && !isEstadoPagado(estadoPagoActual)) {
            siguienteEstadoPago = "Pagado";
          } else if (normalizedUpdatedState === "cancelado") {
            if (isMetodoContraentrega(metodoPago)) {
              siguienteEstadoPago = "Rechazado";
            } else if (isMetodoTarjeta(metodoPago)) {
              siguienteEstadoPago = "Reembolsado";
            }
          }

          if (
            siguienteEstadoPago &&
            normalizeStatus(estadoPagoActual) !== normalizeStatus(siguienteEstadoPago)
          ) {
            const pagoResponse = await fetch(`/api/pago/${pagoId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                estadoPago: siguienteEstadoPago,
                ...(siguienteEstadoPago === "Pagado"
                  ? { fechaPago: new Date().toISOString() }
                  : {}),
              }),
            });

            const pagoJson = await pagoResponse.json().catch(() => null);
            if (!pagoResponse.ok || !pagoJson?.ok) {
              throw new Error(
                pagoJson?.error ?? "La entrega se actualizo, pero no se pudo sincronizar el estado del pago."
              );
            }
          }
        }

        const updatedState = getDisplayLabel(updatedStateRaw);
        setStatus(updatedState);
        setMessage(`Estado actualizado a ${updatedState}.`);
        onUpdated?.(updatedState);
        router.refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cambiar el estado de entrega.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [entregaId, estadoPagoActual, metodoPago, onUpdated, pagoId, pedidoId, router]
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

      const confirmed = window.confirm(`Desea cambiar el estado a ${getDisplayLabel(nextState)}?`);
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
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Actualizar estado de entrega</h2>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-slate-400">Estado actual:</span>
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
                className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.86))] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-sky-300/25 hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cambiar a {getDisplayLabel(nextState)}
              </button>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              Esta entrega no tiene cambios de estado disponibles desde su estado actual.
            </div>
          )}
        </div>

        {message ? (
          <div className="mt-4 rounded-[1.25rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-[1.25rem] border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </div>

      {pendingState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.6)]">
            <h3 className="text-lg font-semibold text-white">
              Cambiar a {getDisplayLabel(pendingState)}
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Puedes registrar una observacion sobre el motivo. Esta observacion se guardara en la entrega y en el historial.
            </p>

            <label className="mt-5 block text-sm font-medium text-slate-200">
              Observacion del motivo
            </label>
            <textarea
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              rows={4}
              placeholder="Describe el motivo de no entrega o cancelacion"
              className="mt-2 w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/35"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={submitPendingState}
                disabled={loading}
                className="flex-1 rounded-[1.25rem] border border-[#c9a55c]/35 bg-[linear-gradient(135deg,#d2ac67,#9f7b32)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex-1 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
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
