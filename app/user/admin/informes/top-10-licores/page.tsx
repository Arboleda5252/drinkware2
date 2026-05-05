import Link from "next/link";
import { sql } from "@/app/Datalibs/database";

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

async function getTopLicores(month: number, year: number): Promise<TopLiquor[]> {
  try {
    const { rows } = await sql<{
      idproducto: number;
      nombre: string;
      categoria: string | null;
      total_sold: number;
      total_revenue: number;
    }>(`
      SELECT
        p.idproducto,
        p.nombre,
        p.categoria,
        COALESCE(SUM(dp.cantidad), 0) AS total_sold,
        COALESCE(SUM(dp.subtotal), 0) AS total_revenue
      FROM public.detalle_pedido dp
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      JOIN public.producto p ON dp.id_producto = p.idproducto
      WHERE p.estados = 'Disponible'
        AND EXTRACT(MONTH FROM ped.fecha_creacion) = $1
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $2
      GROUP BY p.idproducto, p.nombre, p.categoria
      ORDER BY total_sold DESC, total_revenue DESC
      LIMIT 10;
    `, [month, year]);

    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.total_revenue), 0) || 1;

    return rows.map((row) => ({
      id: Number(row.idproducto),
      name: row.nombre,
      category: row.categoria || "Sin categoría",
      sold: Number(row.total_sold),
      revenue: Number(row.total_revenue),
      share: Math.round((Number(row.total_revenue) / totalRevenue) * 100),
    }));
  } catch (error) {
    console.error("[getTopLicores] Error ejecutando consulta", error);
    return [];
  }
}

function normalizeMonth(value?: string) {
  const month = Number(value);
  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    return month;
  }
  return new Date().getMonth() + 1;
}

function normalizeYear(value?: string) {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2020 && year <= new Date().getFullYear()) {
    return year;
  }
  return new Date().getFullYear();
}

export default async function Top10LicoresPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const selectedMonth = normalizeMonth(searchParams.month);
  const selectedYear = normalizeYear(searchParams.year);
  const topLicores = await getTopLicores(selectedMonth, selectedYear);

  const label = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    label: MONTHS[index],
  }));

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-4xl border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Top 10 licores
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Los 10 licores más vendidos por mes
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Analiza las botellas más rotadas en el mes seleccionado y compara su desempeño por ingresos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-3xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-200">
                Mes seleccionado: <span className="font-semibold text-white">{label}</span>
              </div>
              <Link
                href="/user/admin/informes"
                className="inline-flex items-center rounded-full border border-slate-700/70 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Volver a informes
              </Link>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {monthOptions.map((option) => (
              <Link
                key={option.month}
                href={`/user/admin/informes/top-10-licores?month=${option.month}&year=${selectedYear}`}
                className={`rounded-3xl border px-4 py-3 text-sm font-medium transition ${
                  option.month === selectedMonth
                    ? "border-sky-400 bg-sky-500/15 text-white"
                    : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-sky-300 hover:bg-slate-800"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/80">
            <div className="grid grid-cols-6 gap-4 border-b border-slate-700/50 bg-slate-950/90 px-5 py-4 text-sm uppercase tracking-[0.18em] text-slate-400">
              <span className="col-span-2">Producto</span>
              <span>Categoría</span>
              <span className="text-right">Unidades</span>
              <span className="text-right">Ingresos</span>
              <span className="text-right">Participación</span>
            </div>

            <div className="divide-y divide-slate-800">
              {topLicores.length > 0 ? (
                topLicores.map((liquor, index) => (
                  <div key={liquor.id} className="grid grid-cols-6 gap-4 px-5 py-4 text-sm text-slate-200">
                    <span className="col-span-2 font-semibold text-white">{index + 1}. {liquor.name}</span>
                    <span className="text-slate-300">{liquor.category}</span>
                    <span className="text-right text-slate-300">{liquor.sold.toLocaleString()}</span>
                    <span className="text-right text-slate-300">${liquor.revenue.toLocaleString()}</span>
                    <span className="text-right text-sky-300">{liquor.share}%</span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-slate-400">
                  No hay suficientes datos de venta para el mes seleccionado.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
