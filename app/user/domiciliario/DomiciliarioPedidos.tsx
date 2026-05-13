"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
  asignada: "bg-sky-100 text-sky-900",
  asignado: "bg-sky-100 text-sky-900",
  no_entregado: "bg-rose-100 text-rose-900",
  cancelado: "bg-slate-200 text-slate-900",
};

function normalizeStatus(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, "_") : "";
}

function getStatusLabel(status: string | null) {
  const normalized = normalizeStatus(status);

  const labels: Record<string, string> = {
    asignada: "Asignada",
    asignado: "Asignada",
    no_entregado: "No entregado",
    cancelado: "Cancelado",
  };

  return labels[normalized] ?? (status ?? "Sin estado");
}

function getStatusClass(status: string | null) {
  return statusStyles[normalizeStatus(status)] ?? "bg-slate-100 text-slate-900";
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

function PedidoCard({ entrega }: { entrega: EntregaAsignada }) {
  const normalizedStatus = normalizeStatus(entrega.estadoEntrega);
  const fechaPrincipal =
    normalizedStatus === "cancelado" ? entrega.fechaCancelado : entrega.fechaAsignacion;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm shadow-slate-200/50 transition hover:shadow-md">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">
            Pedido # {entrega.idPedido} para {entrega.nombreRecibe ?? "Entrega asignada"}
          </h3>
          <p className="text-sm text-slate-600">
            {entrega.direccionEntrega ?? "Direccion no registrada"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(entrega.estadoEntrega)}`}>
            {getStatusLabel(entrega.estadoEntrega)}
          </span>
          <Link
            href={`/user/domiciliario/pedidos/${entrega.idPedido}`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Gestionar entrega
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Ciudad</p>
            <p className="text-sm text-slate-600">{entrega.ciudad ?? "No registrada"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Telefono</p>
            <p className="text-sm text-slate-600">{entrega.telefonoContacto ?? "No registrado"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {normalizedStatus === "cancelado" ? "Fecha de cancelacion" : "Fecha de asignacion"}
            </p>
            <p className="text-sm text-slate-600">{formatDate(fechaPrincipal)}</p>
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
        ["asignada", "asignado", "cancelado", "no_entregado"].includes(
          normalizeStatus(item.estadoEntrega)
        )
      ),
    [entregas]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Tus pedidos asignados</h2>
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
              Actualizar pedidos 
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
      ) : entregasVisibles.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center text-slate-600 shadow-sm shadow-slate-200/50">
          <p className="text-xl font-semibold text-slate-900">No tienes pedidos visibles en este panel</p>
          <p className="mt-3 text-sm">
            Revisa nuevamente en unos minutos
          </p>
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
