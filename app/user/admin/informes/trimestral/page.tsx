import { sql } from "@/app/Datalibs/database";
import Link from "next/link";
import QuarterFilter from "./quarter-filter";
import QuarterSummary from "./quarter-summary";
import MonthlySalesBreakdown from "./monthly-breakdown";
import CategoryAnalysis from "./category-analysis";
import LowRotationProducts from "./low-rotation-products";
import SalesByDayHour from "./sales-by-day-hour";
import DeliveryAnalysis from "./delivery-analysis";
import ProfitabilityAnalysis from "./profitability-analysis";

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

async function getQuarterStats(quarter: number, year: number): Promise<QuarterStats> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const { rows: salesData } = await sql<{
      total_sales: number;
      total_revenue: number;
      transaction_count: number;
    }>(`
      SELECT
        COALESCE(SUM(dp.cantidad), 0) as total_sales,
        COALESCE(SUM(dp.subtotal), 0) as total_revenue,
        COUNT(DISTINCT p.id_pedido) as transaction_count
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
    `, [monthStart, monthEnd, year]);

    const totalRevenue = Number(salesData[0]?.total_revenue) || 0;
    const totalSales = Number(salesData[0]?.total_sales) || 0;
    const transactionCount = Number(salesData[0]?.transaction_count) || 0;
    const avgTicket = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

    // Get previous quarter growth
    const prevMonthStart = ((quarter - 2) * 3 + 1) || 10;
    const prevMonthEnd = ((quarter - 2) * 3 + 3) || 12;
    const prevYear = quarter === 1 ? year - 1 : year;

    const { rows: prevData } = await sql<{ total_revenue: number }>(`
      SELECT COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
    `, [prevMonthStart, prevMonthEnd, prevYear]);

    const prevRevenue = Number(prevData[0]?.total_revenue) || 0;
    const growthPercent = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    // Get top category
    const { rows: categoryData } = await sql<{ category: string; revenue: number }>(`
      SELECT
        p.categoria as category,
        COALESCE(SUM(dp.subtotal), 0) as revenue
      FROM public.detalle_pedido dp
      JOIN public.producto p ON dp.id_producto = p.idproducto
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      GROUP BY p.categoria
      ORDER BY revenue DESC
      LIMIT 1
    `, [monthStart, monthEnd, year]);

    const topCategory = categoryData[0]?.category || "N/A";

    return {
      quarter,
      year,
      totalSales,
      totalRevenue,
      transactionCount,
      avgTicket,
      growthPercent,
      topCategory,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas del trimestre:", error);
    return {
      quarter,
      year,
      totalSales: 0,
      totalRevenue: 0,
      transactionCount: 0,
      avgTicket: 0,
      growthPercent: 0,
      topCategory: "N/A",
    };
  }
}

export default async function TrimestralPage() {
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  const stats = await getQuarterStats(currentQuarter, currentYear);

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="rounded-4xl border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Informe Trimestral
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Análisis de Ventas por Trimestre
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Visualiza el desempeño completo de tu licorería: ventas, categorías, horarios pico, tipos de entrega y rentabilidad en un informe detallado.
              </p>
            </div>

            <Link
              href="/user/admin/informes"
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver a informes
            </Link>
          </div>
        </section>

        {/* Quarter Filter */}
        <QuarterFilter currentQuarter={currentQuarter} currentYear={currentYear} />

        {/* Quarter Summary */}
        <QuarterSummary stats={stats} />

        {/* Monthly Breakdown */}
        <MonthlySalesBreakdown quarter={stats.quarter} year={stats.year} />

        {/* Category Analysis */}
        <CategoryAnalysis quarter={stats.quarter} year={stats.year} />

        {/* Sales by Day and Hour */}
        <SalesByDayHour quarter={stats.quarter} year={stats.year} />

        {/* Delivery Analysis */}
        <DeliveryAnalysis quarter={stats.quarter} year={stats.year} />

        {/* Low Rotation Products */}
        <LowRotationProducts />

        {/* Profitability Analysis */}
        <ProfitabilityAnalysis quarter={stats.quarter} year={stats.year} />
      </div>
    </main>
  );
}

