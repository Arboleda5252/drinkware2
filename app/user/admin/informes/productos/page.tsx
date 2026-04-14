import Link from "next/link";
import { sql } from "@/app/Datalibs/database";

const stats = {
  totalProducts: 84,
  totalSales: 23560,
  averageTicket: 125,
};

const products = [
  { name: "Marina Rodríguez", sold: 1320, revenue: 6760, share: 18 },
  { name: "Sirope de Anís", sold: 940, revenue: 4820, share: 13 },
  { name: "Fernet Premium", sold: 760, revenue: 3940, share: 10 },
  { name: "Cerveza Artesanal", sold: 1120, revenue: 7110, share: 19 },
];

async function getProductStats() {
  try {
    // Total productos
    const { rows: productCount } = await sql<{ count: number }>(
      "SELECT COUNT(*) as count FROM public.producto WHERE estados = 'Disponible'"
    );

    // Ventas totales e ingresos
    const { rows: salesData } = await sql<{ total_sales: number; total_revenue: number }>(`
      SELECT
        COALESCE(SUM(dp.cantidad), 0) as total_sales,
        COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.detallepedido dp
    `);

    const totalProducts = productCount[0]?.count || 0;
    const totalSales = salesData[0]?.total_sales || 0;
    const totalRevenue = salesData[0]?.total_revenue || 0;
    const averageTicket = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    return {
      totalProducts,
      totalSales,
      averageTicket,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de productos:", error);
    return stats;
  }
}

async function getTopProducts() {
  try {
    const { rows } = await sql<{
      nombre: string;
      total_sold: number;
      total_revenue: number;
    }>(`
      SELECT
        p.nombre,
        COALESCE(SUM(dp.cantidad), 0) as total_sold,
        COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.producto p
      LEFT JOIN public.detallepedido dp ON p.idproducto = dp.id_producto
      WHERE p.estados = 'Disponible'
      GROUP BY p.idproducto, p.nombre
      HAVING COALESCE(SUM(dp.cantidad), 0) > 0
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Calcular participación total para porcentajes
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.total_revenue), 0);

    return rows.map(row => ({
      name: row.nombre,
      sold: Number(row.total_sold),
      revenue: Number(row.total_revenue),
      share: totalRevenue > 0 ? Math.round((Number(row.total_revenue) / totalRevenue) * 100) : 0,
    }));
  } catch (error) {
    console.error("Error obteniendo productos top:", error);
    return products;
  }
}

export default async function InformeProductoPage() {
  const [statsData, productsData] = await Promise.all([
    getProductStats(),
    getTopProducts(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Informe por producto
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Rendimiento de productos
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Revisa ventas, participación y comportamiento de producto para tomar decisiones rápidas desde un panel limpio y bien delimitado.
              </p>
            </div>

            <Link
              href="/user/admin/informes"
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver a informes
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total productos</p>
              <p className="mt-3 text-3xl font-bold text-white">{statsData.totalProducts}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ventas totales</p>
              <p className="mt-3 text-3xl font-bold text-white">{statsData.totalSales.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ticket promedio</p>
              <p className="mt-3 text-3xl font-bold text-white">${statsData.averageTicket.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Productos más vendidos</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Ordena y compara resultados por volumen, ingresos y participación de mercado.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-700/40 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">Filtrar por</p>
                  <p className="mt-1 text-slate-400">Últimos 30 días</p>
                </div>
                <div className="rounded-2xl border border-slate-700/40 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">Categoría</p>
                  <p className="mt-1 text-slate-400">Todas</p>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/80">
              <div className="grid grid-cols-4 gap-4 border-b border-slate-700/50 bg-slate-950/90 px-5 py-4 text-sm uppercase tracking-[0.18em] text-slate-400">
                <span>Producto</span>
                <span className="text-right">Unidades</span>
                <span className="text-right">Ingresos</span>
                <span className="text-right">Participación</span>
              </div>

              <div className="divide-y divide-slate-800">
                {productsData.length > 0 ? (
                  productsData.map((product, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 px-5 py-4 text-sm text-slate-200">
                      <span className="truncate">{product.name}</span>
                      <span className="text-right text-slate-300">{product.sold.toLocaleString()}</span>
                      <span className="text-right text-slate-300">${product.revenue.toLocaleString()}</span>
                      <span className="text-right text-sky-300">{product.share}%</span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-slate-400">
                    No hay datos de ventas disponibles
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-sky-400/10 bg-slate-950/95 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
              Insights del informe
            </p>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              {productsData.length > 0 ? (
                <>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="font-semibold text-white">Producto estrella</p>
                    <p className="mt-2 text-slate-400">
                      "{productsData[0]?.name}" lidera con {productsData[0]?.share}% de participación en ventas.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="font-semibold text-white">Oportunidad clave</p>
                    <p className="mt-2 text-slate-400">
                      {productsData.length > 1 ? `Aumentar stock de "${productsData[1]?.name}" podría elevar ingresos.` : 'Analiza más productos para identificar oportunidades.'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="font-semibold text-white">Tendencia</p>
                    <p className="mt-2 text-slate-400">
                      Los productos con mayor participación concentran {productsData.slice(0, 3).reduce((sum, p) => sum + p.share, 0)}% de las ventas.
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="font-semibold text-white">Sin datos</p>
                  <p className="mt-2 text-slate-400">No hay suficientes datos de ventas para generar insights.</p>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
