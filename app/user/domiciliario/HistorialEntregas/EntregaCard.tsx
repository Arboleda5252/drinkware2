"use client";

import Image from "next/image";
import { useState } from "react";

interface EntregaDetallesProps {
  idEntrega: number;
  idPedido: number;
  nombreRecibe: string | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  estadoEntrega: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  fotoEvidencia: string | null;
  costoEnvio: string;
  observacion: string | null;
  onVerDetalles: (idPedido: number) => void;
}

const estadoColors: Record<string, { bg: string; text: string; badge: string }> = {
  pendiente: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    badge: "bg-amber-100 text-amber-900",
  },
  asignado: {
    bg: "bg-sky-50",
    text: "text-sky-900",
    badge: "bg-sky-100 text-sky-900",
  },
  "en camino": {
    bg: "bg-sky-50",
    text: "text-sky-900",
    badge: "bg-sky-100 text-sky-900",
  },
  entregado: {
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    badge: "bg-emerald-100 text-emerald-900",
  },
  "no entregado": {
    bg: "bg-rose-50",
    text: "text-rose-900",
    badge: "bg-rose-100 text-rose-900",
  },
};

export default function EntregaCard({ 
  idEntrega,
  idPedido,
  nombreRecibe,
  direccionEntrega,
  ciudad,
  estadoEntrega,
  fechaSalida,
  fechaEntrega,
  fotoEvidencia,
  costoEnvio,
  observacion,
  onVerDetalles,
}: EntregaDetallesProps) {
  const [showPhoto, setShowPhoto] = useState(false);

  const colors = estadoColors[estadoEntrega || "pendiente"] || estadoColors.pendiente;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`rounded-lg border border-gray-200 p-6 ${colors.bg}`}>
      <div className="grid gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600">Pedido #{idPedido}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {nombreRecibe || "Nombre no registrado"}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${colors.badge}`}
          >
            {estadoEntrega || "Desconocido"}
          </span>
        </div>

        {/* Ubicación */}
        <div className="text-sm">
          <p className="font-medium text-slate-700">Dirección de entrega:</p>
          <p className="mt-1 text-slate-600">
            {direccionEntrega ? `${direccionEntrega}, ${ciudad}` : "Dirección no especificada"}
          </p>
        </div>

        {/* Fechas */}
        <div className="grid gap-2 sm:grid-cols-2">
          {fechaSalida && (
            <div className="text-sm">
              <p className="font-medium text-slate-700">Fecha de salida:</p>
              <p className="text-slate-600">{formatDate(fechaSalida)}</p>
            </div>
          )}
          {fechaEntrega && estadoEntrega === "entregado" && (
            <div className="text-sm">
              <p className="font-medium text-slate-700">Fecha de entrega:</p>
              <p className="text-slate-600">{formatDate(fechaEntrega)}</p>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {observacion && (
          <div className="text-sm">
            <p className="font-medium text-slate-700">Observaciones:</p>
            <p className="mt-1 text-slate-600">{observacion}</p>
          </div>
        )}

        {/* Foto de evidencia */}
        {fotoEvidencia && (
          <div className="text-sm">
            <button
              onClick={() => setShowPhoto(true)}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-medium text-emerald-600 hover:bg-slate-50"
            >
              <span>📷</span>
              <span>Ver foto de evidencia</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-slate-700">
            Costo: <span className="text-slate-900">${parseFloat(costoEnvio).toFixed(2)}</span>
          </p>
          <button
            onClick={() => onVerDetalles(idPedido)}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            Ver detalles del pedido
          </button>
        </div>
      </div>

      {/* Modal de foto */}
      {showPhoto && fotoEvidencia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPhoto(false)}
        >
          <div
            className="relative max-h-screen max-w-2xl overflow-auto rounded-lg bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPhoto(false)}
              className="absolute right-2 top-2 rounded-full bg-gray-100 p-2 hover:bg-gray-200"
            >
              ✕
            </button>
            <Image
              src={fotoEvidencia}
              alt="Foto de evidencia"
              width={800}
              height={600}
              className="rounded-lg object-contain"
            />
            <p className="mt-4 text-center text-sm text-gray-600">
              Foto de evidencia - Pedido #{idPedido}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}