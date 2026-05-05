'use client';

import { useState } from 'react';

interface QuarterFilterProps {
  currentQuarter: number;
  currentYear: number;
}

export default function QuarterFilter({ currentQuarter, currentYear }: QuarterFilterProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>(String(currentQuarter));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  const quarters = [
    { value: '1', label: 'Trimestre 1 (Ene-Mar)' },
    { value: '2', label: 'Trimestre 2 (Abr-Jun)' },
    { value: '3', label: 'Trimestre 3 (Jul-Sep)' },
    { value: '4', label: 'Trimestre 4 (Oct-Dic)' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleFilter = () => {
    console.log(`Filtrar por: Trimestre ${selectedQuarter} del ${selectedYear}`);
    // Aquí irá la lógica de filtrado con URL query params
  };

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rounded-4xl border border-white/10 bg-slate-900/90 p-6">
      <div>
        <h2 className="text-lg font-bold text-white">Selecciona período</h2>
        <p className="mt-1 text-sm text-slate-400">Elige un trimestre y año para ver el análisis</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <select
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          className="rounded-2xl border border-slate-700/40 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {quarters.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-2xl border border-slate-700/40 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <button
          onClick={handleFilter}
          className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
        >
          Filtrar
        </button>
      </div>
    </section>
  );
}

