"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type TopLiquor = {
  id: number;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  share: number;
};

interface Top10LicoresClientProps {
  initialMonth: number;
  year: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

export default function Top10LicoresClient({ initialMonth, year }: Top10LicoresClientProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [topLicores, setTopLicores] = useState<TopLiquor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = useMemo(
    () =>
      MONTHS.map((label, index) => ({
        month: index + 1,
        label,
      })),
    []
  );

  useEffect(() => {
    async function loadTopLicores() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/informes/top-10-licores?month=${selectedMonth}&year=${year}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "No se pudo cargar el Top 10 de licores");
        }

        setTopLicores(result.data.topLicores || []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Error al cargar datos");
        setTopLicores([]);
      } finally {
        setLoading(false);
      }
    }

    loadTopLicores();
  }, [selectedMonth, year]);

  return (
    <>
      <form className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex w-full flex-col gap-2 text-sm text-slate-300 sm:w-auto">
          Mes seleccionado
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(Number(event.target.value))}
            className="rounded-3xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
          >
            {monthOptions.map((option) => (
              <option key={option.month} value={option.month}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/80">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-700/50 bg-slate-950/90 px-5 py-4 text-sm uppercase tracking-[0.18em] text-slate-400">
          <span className="col-span-2">Producto</span>
          <span>Categoría</span>
          <span className="text-right">Unidades</span>
          <span className="text-right">Ingresos</span>
          <span className="text-right">Participación</span>
        </div>

        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="px-5 py-8 text-center text-slate-400">Cargando Top 10...</div>
          ) : error ? (
            <div className="px-5 py-8 text-center text-rose-300">{error}</div>
          ) : topLicores.length > 0 ? (
            topLicores.map((liquor, index) => (
              <div key={liquor.id} className="grid grid-cols-6 gap-4 px-5 py-4 text-sm text-slate-200">
                <span className="col-span-2 font-semibold text-white">{index + 1}. {liquor.name}</span>
                <span className="text-slate-300">{liquor.category}</span>
                <span className="text-right text-slate-300">{formatNumber(liquor.sold)}</span>
                <span className="text-right text-slate-300">{formatCurrency(liquor.revenue)}</span>
                <span className="text-right text-sky-300">{liquor.share}%</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-slate-400">No hay suficientes datos de venta para el mes seleccionado.</div>
          )}
        </div>
      </div>
    </>
  );
}
