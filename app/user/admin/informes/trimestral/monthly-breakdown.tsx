import { sql } from "@/app/Datalibs/database";

interface MonthlyBreakdownProps {
  quarter: number;
  year: number;
}

interface MonthlySales {
  month: number;
  monthName: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  delivery: number;
  pickUp: number;
}

async function getMonthlySalesData(quarter: number, year: number): Promise<MonthlySales[]> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const { rows: monthlySalesData } = await sql<{
      month: number;
      revenue: number;
      orders: number;
      delivery: number;
      pickup: number;
    }>(`
      SELECT
        EXTRACT(MONTH FROM p.fecha_creacion)::int as month,
        COALESCE(SUM(dp.subtotal), 0) as revenue,
        COUNT(DISTINCT p.id_pedido) as orders,
        COALESCE(SUM(CASE WHEN p.tipo_entrega = 'domicilio' THEN 1 ELSE 0 END), 0) as delivery,
        COALESCE(SUM(CASE WHEN p.tipo_entrega IN ('retiro', 'pickup', 'en_tienda') THEN 1 ELSE 0 END), 0) as pickup
      FROM public.pedido p
      LEFT JOIN public.detalle_pedido dp ON p.id_pedido = dp.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
      GROUP BY EXTRACT(MONTH FROM p.fecha_creacion)
      ORDER BY month
    `, [monthStart, monthEnd, year]);

    return monthlySalesData.map(row => ({
      month: row.month,
      monthName: months[row.month - 1],
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      avgTicket: row.orders > 0 ? Math.round(Number(row.revenue) / Number(row.orders)) : 0,
      delivery: Number(row.delivery),
      pickUp: Number(row.pickup),
    }));
  } catch (error) {
    console.error("Error obteniendo datos mensuales:", error);
    return [];
  }
}

export default async function MonthlySalesBreakdown({ quarter, year }: MonthlyBreakdownProps) {
  const monthlyData = await getMonthlySalesData(quarter, year);

  if (monthlyData.length === 0) {
    return null;
  }

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Desglose Mensual</h2>
        <p className="mt-2 text-sm text-slate-400">Comparación de ventas, pedidos y tipos de entrega por mes</p>
      </div>

      <div className="space-y-4">
        {monthlyData.map((month) => (
          <div key={month.month} className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <div className="grid gap-4 sm:grid-cols-5 mb-4">
              <div className="col-span-1 sm:col-span-1">
                <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Mes</p>
                <p className="mt-2 text-lg font-bold text-white">{month.monthName}</p>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Ventas</p>
                <p className="mt-2 text-lg font-bold text-sky-300">${month.revenue.toLocaleString()}</p>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Pedidos</p>
                <p className="mt-2 text-lg font-bold text-white">{month.orders}</p>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Ticket Prom.</p>
                <p className="mt-2 text-lg font-bold text-white">${month.avgTicket}</p>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Envíos</p>
                <p className="mt-2 text-xs space-y-1">
                  <span className="block text-slate-300">🚚 {month.delivery} dom.</span>
                  <span className="block text-slate-300">🏪 {month.pickUp} retiro</span>
                </p>
              </div>
            </div>

            {/* Visual bar */}
            <div className="h-2 bg-slate-800/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-sky-500 to-sky-400"
                style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

