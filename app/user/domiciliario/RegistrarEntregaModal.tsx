"use client";

import { useState, useEffect } from "react";
import CameraCapture from "../HistorialEntregas/CameraCapture";

interface Pedido {
  idPedido: number;
  idEntrega: number;
  direccion: string;
  ciudad: string;
  nombreRecibe: string;
  estadoEntrega: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

interface RegistrarEntregaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntregaRegistrada: () => void;
}

export default function RegistrarEntregaModal({
  isOpen,
  onClose,
  onEntregaRegistrada,
}: RegistrarEntregaModalProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<number | null>(null);
  const [nombreRecibe, setNombreRecibe] = useState("");
  const [observacion, setObservacion] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPedidos();
    }
  }, [isOpen]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pedidos?estado=asignado");
      const data = await response.json();

      if (data.ok) {
        setPedidos(data.data);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = async (photoBase64: string) => {
    if (!selectedPedido) return;

    const pedido = pedidos.find((p) => p.idPedido === selectedPedido);
    if (!pedido) return;

    try {
      const response = await fetch("/api/entregas-historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idEntrega: pedido.idEntrega,
          nombreRecibe: nombreRecibe || pedido.nombreRecibe,
          fotoEvidencia: photoBase64,
          observacion: observacion || null,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        alert("Entrega registrada exitosamente");
        setShowCamera(false);
        setSelectedPedido(null);
        setNombreRecibe("");
        setObservacion("");
        onEntregaRegistrada();
        onClose();
      } else {
        alert(data.error || "Error al registrar la entrega");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar la entrega");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Registrar Entrega</h2>
          <button
            onClick={onClose}
            className="rounded-full hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {!showCamera && (
          <div className="space-y-4">
            {/* Seleccionar pedido */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Selecciona el pedido a entregar
              </label>
              <select
                value={selectedPedido || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedPedido(id);
                  const pedido = pedidos.find((p) => p.idPedido === id);
                  if (pedido) setNombreRecibe(pedido.nombreRecibe);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                <option value="">-- Selecciona un pedido --</option>
                {pedidos.map((pedido) => (
                  <option key={pedido.idPedido} value={pedido.idPedido}>
                    Pedido #{pedido.idPedido} - {pedido.nombreRecibe}
                  </option>
                ))}
              </select>
            </div>

            {/* Detalles if selected */}
            {selectedPedido && (
              <>
                {pedidos
                  .filter((p) => p.idPedido === selectedPedido)
                  .map((pedido) => (
                    <div
                      key={pedido.idPedido}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-2 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Dirección:</span>
                          <p className="text-slate-600">
                            {pedido.direccion}, {pedido.ciudad}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Productos:</span>
                          <ul className="mt-1 ml-4 list-disc text-slate-600">
                            {pedido.productos.map((prod, idx) => (
                              <li key={idx}>
                                {prod.nombre} x{prod.cantidad}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Nombre de quien recibe */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Nombre de quien recibe
                  </label>
                  <input
                    type="text"
                    value={nombreRecibe}
                    onChange={(e) => setNombreRecibe(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    placeholder="Nombre de quien recibe"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    placeholder="Ej: Puerta trasera, con portero, etc."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="flex-1 rounded-lg bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-600"
                  >
                    📷 Capturar Foto
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <CameraCapture
            onPhotoCapture={handlePhotoCapture}
            onCancel={() => setShowCamera(false)}
          />
        )}
      </div>
    </div>
  );
}