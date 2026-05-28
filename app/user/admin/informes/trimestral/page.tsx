import { getQuarterStats, normalizeQuarterParams } from "@/app/api/informes/trimestral/data";
import Link from "next/link";
import QuarterFilter from "./quarter-filter";
import QuarterSummary from "./quarter-summary";
import MonthlySalesBreakdown from "./monthly-breakdown";
import CategoryAnalysis from "./category-analysis";
import LowRotationProducts from "./low-rotation-products";
import SalesByDayHour from "./sales-by-day-hour";
import DeliveryAnalysis from "./delivery-analysis";
import ProfitabilityAnalysis from "./profitability-analysis";

export const dynamic = "force-dynamic";

interface TrimestralPageProps {
  searchParams: Promise<{
    quarter?: string | string[];
    year?: string | string[];
  }>;
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function TrimestralPage({ searchParams }: TrimestralPageProps) {
  const params = await searchParams;
  const { quarter: currentQuarter, year: currentYear } = normalizeQuarterParams(
    getParamValue(params.quarter),
    getParamValue(params.year)
  );

  const stats = await getQuarterStats(currentQuarter, currentYear);

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-4xl border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Informe Trimestral
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Analisis de Ventas por Trimestre
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Visualiza el desempeño completo de tu licoreria: ventas, categorias, horarios pico, tipos de entrega y rentabilidad en un informe detallado.
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

        <QuarterFilter
          key={`filter-${currentQuarter}-${currentYear}`}
          currentQuarter={currentQuarter}
          currentYear={currentYear}
        />

        <QuarterSummary key={`summary-${stats.quarter}-${stats.year}`} stats={stats} />

        <MonthlySalesBreakdown quarter={stats.quarter} year={stats.year} />

        <CategoryAnalysis quarter={stats.quarter} year={stats.year} />

        <SalesByDayHour quarter={stats.quarter} year={stats.year} />

        <ProfitabilityAnalysis quarter={stats.quarter} year={stats.year} />
      </div>
    </main>
  );
}
