interface QuarterStats {
  quarter: number;
  year: number;
  totalSales: number;
  totalRevenue: number;
  transactionCount: number;
  avgTicket: number;
  growthPercent: number;
  topCategory: string;
}

interface QuarterSummaryProps {
  stats: QuarterStats;
}

export default function QuarterSummary({ stats }: QuarterSummaryProps) {
  const isPositiveGrowth = stats.growthPercent >= 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ventas Totales</p>
        <p className="mt-3 text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
        <p className="mt-2 text-xs text-slate-500">Trimestre {stats.quarter}</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Crecimiento vs Anterior</p>
        <p className={`mt-3 text-3xl font-bold ${isPositiveGrowth ? 'text-green-400' : 'text-red-400'}`}>
          {isPositiveGrowth ? '+' : ''}{stats.growthPercent}%
        </p>
        <p className="mt-2 text-xs text-slate-500">Variación trimestral</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ticket Promedio</p>
        <p className="mt-3 text-3xl font-bold text-white">${stats.avgTicket.toLocaleString()}</p>
        <p className="mt-2 text-xs text-slate-500">Por transacción</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Transacciones</p>
        <p className="mt-3 text-3xl font-bold text-white">{stats.transactionCount.toLocaleString()}</p>
        <p className="mt-2 text-xs text-slate-500">Número de pedidos</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Top Categoría</p>
        <p className="mt-3 text-2xl font-bold text-sky-300">{stats.topCategory}</p>
        <p className="mt-2 text-xs text-slate-500">Más rentable</p>
      </div>
    </section>
  );
}

