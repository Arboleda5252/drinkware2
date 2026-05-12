"use client";

import { useEffect, useState } from "react";
import EntregaCard from "./EntregaCard";
import CameraCapture from "./CameraCapture";

interface HistorialEntrega {
  idHistorial: number;
  idEntrega: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  idUsuario: number;
  comentario: string | null;
  fotoEvidencia: string | null;
  entrega: {
    idEntrega: number;
    idPedido: number;
    idDomiciliario: number | null;
    nombreRecibe: string | null;
    direccionEntrega: string | null;
    ciudad: string | null;
    estadoEntrega: string | null;
    fechaSalida: string | null;
    fechaEntrega: string | null;
    costoEnvio: string;
    observacion: string | null;
  } | null;
  usuario: {
    idUsuario: number;
    nombre: string;
    email: string;
  } | null;
}

type EstadoFiltro = "todos" | "entregado" | "pendiente" | "en camino" | "no entregado";

export default function HistorialEntregasClient() {
  const [historialEntregas, setHistorialEntregas] = useState<HistorialEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [registrandoEntrega, setRegistrandoEntrega] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const estado = estadoFiltro === "todos" ? "" : estadoFiltro;
      const query = new URLSearchParams({
        limit: "10",
        offset: (page * 10).toString(),
        ...(estado && { estado }),
      });

      const response = await fetch(`/api/historial_entrega?${query}`);
      const data = await response.json();

      if (data.ok) {
        setHistorialEntregas(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
      alert("Error al cargar el historial de entregas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [estadoFiltro]);

  useEffect(() => {
    fetchEntregas();
  }, [estadoFiltro, page]);

  const handleRegistrarEntrega = (idEntrega: number) => {
    setRegistrandoEntrega(idEntrega);
    setShowCamera(true);
  };

  const handlePhotoCapture = async (photoBase64: string) => {
    if (!registrandoEntrega) return;

    try {
      const response = await fetch("/api/historial_entrega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idEntrega: registrandoEntrega,
          fotoEvidencia: photoBase64,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        alert("Entrega registrada exitosamente");
        setShowCamera(false);
        setRegistrandoEntrega(null);
        fetchEntregas();
      } else {
        alert(data.error || "Error al registrar la entrega");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar la entrega");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <header className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/50">
        <h1 className="text-3xl font-semibold text-slate-900">Historial de Entregas</h1>
        <p className="mt-3 text-sm text-slate-600">
          Aquí encontrarás todas tus entregas registradas con fecha, hora y evidencia fotográfica.
        </p>
      </header>

      {/* Filtros */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Filtrar por estado</h2>
        <div className="flex flex-wrap gap-2">
          {(["todos", "entregado", "pendiente", "en camino", "no entregado"] as EstadoFiltro[]).map(
            (estado) => (
              <button
                key={estado}
                onClick={() => setEstadoFiltro(estado)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  estadoFiltro === estado
                    ? "bg-sky-500 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-500"></div>
            <p className="text-slate-600">Cargando entregas...</p>
          </div>
        </div>
      ) : historialEntregas.length === 0 ? (
        <div className="rounded-lg bg-white/90 p-12 text-center">
          <p className="text-lg text-slate-600">No hay entregas en esta categoría</p>
          <p className="mt-2 text-sm text-slate-500">Las entregas registradas aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historialEntregas.map((historial) => (
            <div key={historial.idHistorial} className="relative">
              {historial.entrega && (
                <EntregaCard
                  idEntrega={historial.entrega.idEntrega}
                  idPedido={historial.entrega.idPedido}
                  nombreRecibe={historial.entrega.nombreRecibe}
                  direccionEntrega={historial.entrega.direccionEntrega}
                  ciudad={historial.entrega.ciudad}
                  estadoEntrega={historial.entrega.estadoEntrega}
                  fechaSalida={historial.entrega.fechaSalida}
                  fechaEntrega={historial.entrega.fechaEntrega}
                  fotoEvidencia={historial.fotoEvidencia || historial.entrega.fotoEvidencia}
                  costoEnvio={historial.entrega.costoEnvio}
                  observacion={historial.entrega.observacion}
                  onVerDetalles={(idPedido) => {
                    // Aquí puedes navegar a los detalles del pedido si lo deseas
                    window.location.href = `/user/domiciliario/pedidos/${idPedido}`;
                  }}
                />
              )}

              {/* Botón registrar entrega si aún no está entregado */}
              {historial.entrega && historial.entrega.estadoEntrega !== "entregado" && !historial.fotoEvidencia && (
                <div className="absolute right-6 top-6">
                  <button
                    onClick={() => handleRegistrarEntrega(historial.entrega!.idEntrega)}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    Registrar Entrega
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-600">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de cámara */}
      {showCamera && (
        <CameraCapture
          onPhotoCapture={handlePhotoCapture}
          onCancel={() => {
            setShowCamera(false);
            setRegistrandoEntrega(null);
          }}
        />
      )}
    </main>
  );
}
