"use client";

import { useState } from "react";

export interface ProfitabilitySummaryData {
  totalIngresos: number;
  ivaRecaudado: number;
  costoProductos: number;
  gananciaBruta: number;
  gastosPagados: number;
  gastosPendientes: number;
  gananciaNeta: number;
  gananciaNetaTeorica: number;
  margenNeto: number;
}

interface ExpenseRecord {
  id: number;
  trimestre: number;
  año: number;
  concepto: string;
  descripcion: string | null;
  monto: number;
  estado: "pagado" | "pendiente";
  fecha_pago: string | null;
}

interface ProfitabilityAnalysisClientProps {
  quarter: number;
  year: number;
  summary: ProfitabilitySummaryData;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProfitabilityAnalysisClient({ quarter, year, summary }: ProfitabilityAnalysisClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagados, setPagados] = useState<ExpenseRecord[] | null>(null);
  const [pendientes, setPendientes] = useState<ExpenseRecord[] | null>(null);

  const openModal = async () => {
    setModalOpen(true);
    if (pendientes !== null && pagados !== null) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/informes/trimestral/gastos?quarter=${quarter}&year=${year}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "No se pudieron cargar los gastos del trimestre");
      }

      setPagados(result.data.pagados || []);
      setPendientes(result.data.pendientes || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setModalOpen(false);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ingresos Totales</p>
          <p className="mt-3 text-3xl font-bold text-sky-300">{formatCurrency(summary.totalIngresos)}</p>
          <p className="mt-2 text-xs text-slate-500">Neto (sin IVA)</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Recaudo IVA</p>
          <p className="mt-3 text-3xl font-bold text-amber-400">{formatCurrency(summary.ivaRecaudado)}</p>
          <p className="mt-2 text-xs text-slate-500">19% sobre ingresos</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ganancia Bruta</p>
          <p className="mt-3 text-3xl font-bold text-green-400">{formatCurrency(summary.gananciaBruta)}</p>
          <p className="mt-2 text-xs text-slate-500">Ingresos - costo de productos</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Costo Productos</p>
          <p className="mt-3 text-3xl font-bold text-rose-400">{formatCurrency(summary.costoProductos)}</p>
          <p className="mt-2 text-xs text-slate-500">Costo de ventas</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Gastos Pagados</p>
          <p className="mt-3 text-3xl font-bold text-orange-400">{formatCurrency(summary.gastosPagados)}</p>
          <p className="mt-2 text-xs text-slate-500">Operacionales realizados</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Gastos Pendientes</p>
          <p className="mt-3 text-3xl font-bold text-yellow-400">{formatCurrency(summary.gastosPendientes)}</p>
          <p className="mt-2 text-xs text-slate-500">Por pagar</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ganancia Neta</p>
          <p className={`mt-3 text-3xl font-bold ${summary.gananciaNeta >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(summary.gananciaNeta)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Después de gastos pagados</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Margen Neto</p>
          <p className={`mt-3 text-3xl font-bold ${summary.gananciaNeta >= 0 ? "text-green-400" : "text-red-400"}`}>
            {summary.margenNeto}%
          </p>
          <p className="mt-2 text-xs text-slate-500">% sobre ingresos</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Detalle de gastos pendientes</p>
        <p className="mt-3 text-lg font-semibold text-white">{formatCurrency(summary.gastosPendientes)}</p>
        <p className="mt-2 text-xs text-slate-500">Presiona para ver la lista completa de gastos pendientes del trimestre.</p>
        <button
          type="button"
          onClick={openModal}
          className="mt-4 inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Ver detalles de pagos pendientes
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 max-w-5xl rounded-4xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Detalle de Pagos Pendientes</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Gastos del trimestre {quarter} / {year}</h2>
                <p className="mt-2 text-sm text-slate-400">Aquí verás el detalle de partidas pagadas y las que aún están pendientes.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center rounded-full border border-slate-700/80 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-8 space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total Pagado</p>
                  <p className="mt-3 text-3xl font-bold text-green-400">{formatCurrency(summary.gastosPagados)}</p>
                  <p className="mt-2 text-xs text-slate-500">Gastos que ya fueron ejecutados.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total Pendiente</p>
                  <p className="mt-3 text-3xl font-bold text-yellow-400">{formatCurrency(summary.gastosPendientes)}</p>
                  <p className="mt-2 text-xs text-slate-500">Gastos que todavía están por pagar.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Gastos por partida</p>
                {loading ? (
                  <div className="mt-6 rounded-3xl bg-slate-900/80 p-6 text-slate-300">Cargando gastos...</div>
                ) : error ? (
                  <div className="mt-6 rounded-3xl bg-rose-950/80 p-6 text-rose-300">{error}</div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pendientes</p>
                      {pendientes && pendientes.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-700 bg-slate-950">
                          <table className="min-w-full divide-y divide-slate-800 text-sm text-left text-slate-300">
                            <thead className="bg-slate-900">
                              <tr>
                                <th className="px-4 py-3">Concepto</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3">Fecha estimada</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-950">
                              {pendientes.map((gasto) => (
                                <tr key={gasto.id}>
                                  <td className="px-4 py-3">{gasto.concepto}</td>
                                  <td className="px-4 py-3 text-yellow-300">{formatCurrency(gasto.monto)}</td>
                                  <td className="px-4 py-3 text-slate-400">{gasto.descripcion || "-"}</td>
                                  <td className="px-4 py-3 text-slate-400">{gasto.fecha_pago || "No definido"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 text-slate-400">No hay gastos pendientes registrados para este trimestre.</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pagados</p>
                      {pagados && pagados.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-700 bg-slate-950">
                          <table className="min-w-full divide-y divide-slate-800 text-sm text-left text-slate-300">
                            <thead className="bg-slate-900">
                              <tr>
                                <th className="px-4 py-3">Concepto</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3">Fecha de pago</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-950">
                              {pagados.map((gasto) => (
                                <tr key={gasto.id}>
                                  <td className="px-4 py-3">{gasto.concepto}</td>
                                  <td className="px-4 py-3 text-green-300">{formatCurrency(gasto.monto)}</td>
                                  <td className="px-4 py-3 text-slate-400">{gasto.descripcion || "-"}</td>
                                  <td className="px-4 py-3 text-slate-400">{gasto.fecha_pago || "No definido"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 text-slate-400">No hay gastos pagados registrados para este trimestre.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
