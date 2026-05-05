import { sql } from "@/app/Datalibs/database";

interface ProfitabilityAnalysisProps {
  quarter: number;
  year: number;
}

interface ProfitabilityData {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  profitMargin: number;
}

async function getProfitabilityAnalysis(quarter: number, year: number): Promise<ProfitabilityData> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    // Get total revenue
    const { rows: revenueData } = await sql<{ total_revenue: number }>(`
      SELECT
        COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
    `, [monthStart, monthEnd, year]);

    // Get total costs (we'll estimate based on product costs or use a percentage)
    const { rows: costData } = await sql<{ total_cost: number }>(`
      SELECT
        COALESCE(SUM(dp.cantidad * COALESCE(p.costo, p.precio * 0.4)), 0) as total_cost
      FROM public.detalle_pedido dp
      JOIN public.producto p ON dp.id_producto = p.idproducto
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
    `, [monthStart, monthEnd, year]);

    const totalRevenue = Number(revenueData[0]?.total_revenue) || 0;
    const totalCosts = Number(costData[0]?.total_cost) || 0;
    const totalProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      profitMargin,
    };
  } catch (error) {
    console.error("Error obteniendo análisis de rentabilidad:", error);
    return {
      totalRevenue: 0,
      totalCosts: 0,
      totalProfit: 0,
      profitMargin: 0,
    };
  }
}

export default async function ProfitabilityAnalysis({ quarter, year }: ProfitabilityAnalysisProps) {
  const profitability = await getProfitabilityAnalysis(quarter, year);

  const isProfitable = profitability.totalProfit >= 0;

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Análisis de Rentabilidad</h2>
        <p className="mt-2 text-sm text-slate-400">Ingresos, costos y ganancia neta del trimestre</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ingresos Totales</p>
          <p className="mt-3 text-3xl font-bold text-sky-300">${profitability.totalRevenue.toLocaleString()}</p>
          <p className="mt-2 text-xs text-slate-500">Del trimestre completo</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Costos Totales</p>
          <p className="mt-3 text-3xl font-bold text-amber-400">${profitability.totalCosts.toLocaleString()}</p>
          <p className="mt-2 text-xs text-slate-500">Estimado de producto</p>
        </div>

        <div className={`rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm`}>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ganancia Neta</p>
          <p className={`mt-3 text-3xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            ${profitability.totalProfit.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-500">Utilidad del período</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Margen Neto</p>
          <p className={`mt-3 text-3xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {profitability.profitMargin}%
          </p>
          <p className="mt-2 text-xs text-slate-500">Porcentaje de ganancia</p>
        </div>
      </div>

      {/* Breakdown visualization */}
      <div className="mt-8 rounded-2xl border border-slate-800/50 bg-slate-950/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Desglose Financiero</h3>

        <div className="space-y-4">
          {/* Ingresos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Ingresos</span>
              <span className="font-semibold text-sky-300">${profitability.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-slate-800/30 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-sky-500 to-sky-400" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Costos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Costos</span>
              <span className="font-semibold text-amber-400">${profitability.totalCosts.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-slate-800/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-amber-400"
                style={{ width: `${(profitability.totalCosts / profitability.totalRevenue) * 100}%` }}
              />
            </div>
          </div>

          {/* Ganancia */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Ganancia Neta</span>
              <span className={`font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                ${profitability.totalProfit.toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-slate-800/30 rounded-full overflow-hidden">
              <div
                className={`h-full bg-linear-to-r ${isProfitable ? 'from-green-500 to-green-400' : 'from-red-500 to-red-400'}`}
                style={{ width: `${(profitability.totalProfit / profitability.totalRevenue) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 rounded-xl border border-slate-700/40 bg-slate-800/30">
          <p className="text-sm text-slate-200">
            <strong>📊 Insight:</strong> Tu margen neto es del {profitability.profitMargin}%, lo que significa que por cada peso vendido, ganas ${((profitability.totalProfit / profitability.totalRevenue)).toFixed(2)} de utilidad.
          </p>
        </div>
      </div>
    </section>
  );
}

