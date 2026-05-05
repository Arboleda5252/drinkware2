import { sql } from "@/app/Datalibs/database";

interface SalesByDayHourProps {
  quarter: number;
  year: number;
}

interface DayHourData {
  day: string;
  dayNumber: number;
  revenue: number;
  orders: number;
  peakHour: number;
  peakRevenue: number;
}

async function getSalesByDayHour(quarter: number, year: number): Promise<DayHourData[]> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Get sales by day of week
    const { rows: dayData } = await sql<{
      day_of_week: number;
      revenue: number;
      orders: number;
    }>(`
      SELECT
        EXTRACT(DOW FROM p.fecha_creacion)::int as day_of_week,
        COALESCE(SUM(dp.subtotal), 0) as revenue,
        COUNT(DISTINCT p.id_pedido) as orders
      FROM public.pedido p
      LEFT JOIN public.detalle_pedido dp ON p.id_pedido = dp.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
      GROUP BY EXTRACT(DOW FROM p.fecha_creacion)
      ORDER BY day_of_week
    `, [monthStart, monthEnd, year]);

    // Get sales by hour
    const { rows: hourData } = await sql<{
      hour: number;
      revenue: number;
    }>(`
      SELECT
        EXTRACT(HOUR FROM p.fecha_creacion)::int as hour,
        COALESCE(SUM(dp.subtotal), 0) as revenue
      FROM public.pedido p
      LEFT JOIN public.detalle_pedido dp ON p.id_pedido = dp.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
      GROUP BY EXTRACT(HOUR FROM p.fecha_creacion)
      ORDER BY revenue DESC
      LIMIT 1
    `, [monthStart, monthEnd, year]);

    const peakHour = hourData[0]?.hour || 0;
    const peakRevenue = Number(hourData[0]?.revenue) || 0;

    return dayData.map(day => ({
      day: dayNames[day.day_of_week],
      dayNumber: day.day_of_week,
      revenue: Number(day.revenue),
      orders: Number(day.orders),
      peakHour,
      peakRevenue,
    }));
  } catch (error) {
    console.error("Error obteniendo datos de ventas por día/hora:", error);
    return [];
  }
}

export default async function SalesByDayHour({ quarter, year }: SalesByDayHourProps) {
  const salesData = await getSalesByDayHour(quarter, year);

  if (salesData.length === 0) {
    return null;
  }

  const maxRevenue = Math.max(...salesData.map(s => s.revenue), 1);
  const peakDay = salesData.reduce((prev, current) => 
    (prev.revenue > current.revenue) ? prev : current
  );

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Análisis por Día y Hora</h2>
        <p className="mt-2 text-sm text-slate-400">Identifica los días más fuertes y las horas pico de ventas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Day */}
        <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Ventas por Día</h3>
          <div className="space-y-3">
            {salesData.map((day) => (
              <div key={day.dayNumber} className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-300 font-medium">{day.day}</p>
                  <div className="mt-2 h-2 bg-slate-800/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-sky-500 to-sky-400"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">${day.revenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{day.orders} ped.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours and Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Día Más Fuerte</p>
            <p className="mt-3 text-3xl font-bold text-sky-300">{peakDay.day}</p>
            <p className="mt-2 text-sm text-slate-400">${peakDay.revenue.toLocaleString()} en ventas</p>
            <p className="text-sm text-slate-400">{peakDay.orders} pedidos</p>
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Hora Pico</p>
            <p className="mt-3 text-3xl font-bold text-green-400">{String(salesData[0]?.peakHour).padStart(2, '0')}:00</p>
            <p className="mt-2 text-sm text-slate-400">${peakDay.peakRevenue.toLocaleString()} en ingresos</p>
            <p className="text-sm text-slate-400">Máxima actividad</p>
          </div>
        </div>
      </div>
    </section>
  );
}

