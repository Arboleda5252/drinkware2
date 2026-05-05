import { sql } from "@/app/Datalibs/database";

interface CategoryAnalysisProps {
  quarter: number;
  year: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  quantity: number;
  percentage: number;
  avgPrice: number;
}

async function getCategoryAnalysis(quarter: number, year: number): Promise<CategoryData[]> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const { rows: categoryData } = await sql<{
      category: string;
      revenue: number;
      quantity: number;
      avgPrice: number;
    }>(`
      SELECT
        p.categoria as category,
        COALESCE(SUM(dp.subtotal), 0) as revenue,
        COALESCE(SUM(dp.cantidad), 0) as quantity,
        COALESCE(AVG(dp.precioproducto), 0) as "avgPrice"
      FROM public.detalle_pedido dp
      JOIN public.producto p ON dp.id_producto = p.idproducto
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      GROUP BY p.categoria
      ORDER BY revenue DESC
    `, [monthStart, monthEnd, year]);

    const totalRevenue = categoryData.reduce((sum, cat) => sum + Number(cat.revenue), 0);

    return categoryData.map(cat => ({
      category: cat.category || 'Sin categoría',
      revenue: Number(cat.revenue),
      quantity: Number(cat.quantity),
      percentage: totalRevenue > 0 ? Math.round((Number(cat.revenue) / totalRevenue) * 100) : 0,
      avgPrice: Math.round(Number(cat.avgPrice)),
    }));
  } catch (error) {
    console.error("Error obteniendo análisis de categorías:", error);
    return [];
  }
}

export default async function CategoryAnalysis({ quarter, year }: CategoryAnalysisProps) {
  const categories = await getCategoryAnalysis(quarter, year);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Ventas por Categoría</h2>
        <p className="mt-2 text-sm text-slate-400">Ron, cerveza, vino y más - Análisis de rendimiento por categoría</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <div key={category.category} className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">{category.category}</p>
                <p className="mt-2 text-2xl font-bold text-sky-300">${category.revenue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{category.percentage}%</p>
                <p className="text-xs text-slate-400 mt-1">del total</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate-800/30">
              <div>
                <p className="text-slate-400">Unidades vendidas</p>
                <p className="mt-1 text-lg font-semibold text-white">{category.quantity.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Precio promedio</p>
                <p className="mt-1 text-lg font-semibold text-white">${category.avgPrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-slate-800/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-sky-500 to-sky-400"
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

