"use client";

import { useState, useEffect } from "react";
import { FiClock, FiDownload, FiFilter } from "react-icons/fi";
import { MdHistory } from "react-icons/md";

interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto_nombre: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  responsable: string | null;
  referencia: string | null;
  precio_unitario: number | null;
  subtotal: number | null;
}

interface HistorialResponse {
  movimientos: MovimientoInventario[];
  resumen: {
    totalEntradas: number;
    totalSalidas: number;
    saldo: number;
    periodo: string;
  };
}

export function HistorialMovimientos() {
  const [data, setData] = useState<HistorialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<'todos' | 'entrada' | 'salida'>('todos');
  const [dias, setDias] = useState('30');

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const url = `/api/inventario/historial?dias=${dias}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.ok) throw new Error(result.error);
        setData(result.data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [dias]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-slate-400">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Error: {error}
      </div>
    );
  }

  if (!data) return null;

  const movimientosFiltrados = data.movimientos.filter(m =>
    tipo === 'todos' ? true : m.tipo === tipo
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MdHistory className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-bold text-white">Historial de Movimientos</h2>
        </div>
        <div className="flex gap-2">
          <select
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-400">Entradas</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{data.resumen.totalEntradas}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-400">Salidas</p>
          <p className="mt-2 text-2xl font-bold text-orange-400">{data.resumen.totalSalidas}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-400">Saldo</p>
          <p className={`mt-2 text-2xl font-bold ${data.resumen.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.resumen.saldo}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setTipo('todos')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tipo === 'todos'
              ? 'bg-sky-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setTipo('entrada')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tipo === 'entrada'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Entradas
        </button>
        <button
          onClick={() => setTipo('salida')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tipo === 'salida'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Salidas
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/50">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700 bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Producto</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-300">Tipo</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-300">Cantidad</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Valor Unitario</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Total</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Referencia</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {movimientosFiltrados.map((mov) => (
              <tr key={mov.id} className="transition hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{mov.producto_nombre}</p>
                  <p className="text-xs text-slate-400">ID: {mov.producto_id}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      mov.tipo === 'entrada'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-orange-500/20 text-orange-300'
                    }`}
                  >
                    {mov.tipo === 'entrada' ? '📦 Entrada' : '📤 Salida'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-white">
                  {mov.cantidad}
                </td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {mov.precio_unitario ? `$${mov.precio_unitario.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-white">
                  {mov.subtotal ? `$${mov.subtotal.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {mov.referencia}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {new Date(mov.fecha).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {movimientosFiltrados.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-slate-400">No hay movimientos en este período</p>
          </div>
        )}
      </div>
    </div>
  );
}
