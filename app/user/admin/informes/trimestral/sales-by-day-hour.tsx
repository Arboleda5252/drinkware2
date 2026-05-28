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
  productsSold: number;
  peakHour: number;
  peakRevenue: number;
  peakProductsSold: number;
}

async function getSalesByDayHour(quarter: number, year: number): Promise<DayHourData[]> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

    const { rows: dayData } = await sql<{
      day_of_week: number;
      revenue: number;
      orders: number;
      products_sold: number;
    }>(`
      WITH paid_orders AS (
        SELECT DISTINCT ped.id_pedido, ped.fecha_creacion
        FROM public.pedido ped
        JOIN public.pago pg ON pg.id_pedido = ped.id_pedido
        WHERE LOWER(pg.estado_pago) = 'pagado'
          AND EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
          AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      )
      SELECT
        EXTRACT(DOW FROM po.fecha_creacion)::int AS day_of_week,
        COALESCE(SUM(dp.subtotal), 0)::double precision AS revenue,
        COUNT(DISTINCT po.id_pedido)::int AS orders,
        COALESCE(SUM(dp.cantidad), 0)::double precision AS products_sold
      FROM paid_orders po
      LEFT JOIN public.detalle_pedido dp ON po.id_pedido = dp.id_pedido
      GROUP BY EXTRACT(DOW FROM po.fecha_creacion)
      ORDER BY day_of_week
    `, [monthStart, monthEnd, year]);

    const { rows: hourData } = await sql<{
      hour: number;
      revenue: number;
      products_sold: number;
    }>(`
      WITH paid_orders AS (
        SELECT DISTINCT ped.id_pedido, ped.fecha_creacion
        FROM public.pedido ped
        JOIN public.pago pg ON pg.id_pedido = ped.id_pedido
        WHERE LOWER(pg.estado_pago) = 'pagado'
          AND EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
          AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      )
      SELECT
        EXTRACT(HOUR FROM po.fecha_creacion)::int AS hour,
        COALESCE(SUM(dp.subtotal), 0)::double precision AS revenue,
        COALESCE(SUM(dp.cantidad), 0)::double precision AS products_sold
      FROM paid_orders po
      LEFT JOIN public.detalle_pedido dp ON po.id_pedido = dp.id_pedido
      GROUP BY EXTRACT(HOUR FROM po.fecha_creacion)
      ORDER BY products_sold DESC, revenue DESC
      LIMIT 1
    `, [monthStart, monthEnd, year]);

    const peakHour = hourData[0]?.hour || 0;
    const peakRevenue = Number(hourData[0]?.revenue) || 0;
    const peakProductsSold = Number(hourData[0]?.products_sold) || 0;

    return dayData.map((day) => ({
      day: dayNames[day.day_of_week],
      dayNumber: day.day_of_week,
      revenue: Number(day.revenue),
      orders: Number(day.orders),
      productsSold: Number(day.products_sold),
      peakHour,
      peakRevenue,
      peakProductsSold,
    }));
  } catch (error) {
    console.error("Error obteniendo datos de ventas por dia/hora:", error);
    return [];
  }
}

export default async function SalesByDayHour({ quarter, year }: SalesByDayHourProps) {
  const salesData = await getSalesByDayHour(quarter, year);

  if (salesData.length === 0) {
    return null;
  }

  const maxProductsSold = Math.max(...salesData.map((day) => day.productsSold), 1);
  const peakDay = salesData.reduce((prev, current) =>
    prev.productsSold > current.productsSold ? prev : current
  );

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Analisis por Dia y Hora</h2>
        <p className="mt-2 text-sm text-slate-400">
          Identifica los dias con mas productos vendidos y las horas pico de ventas pagadas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Ventas por Dia</h3>
          <div className="space-y-3">
            {salesData.map((day) => (
              <div key={day.dayNumber} className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300">{day.day}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/30">
                    <div
                      className="h-full bg-linear-to-r from-sky-500 to-sky-400"
                      style={{ width: `${(day.productsSold / maxProductsSold) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {day.productsSold.toLocaleString("es-CO")} prod.
                  </p>
                  <p className="text-xs text-slate-400">
                    {day.orders} ped. · ${day.revenue.toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Dia Mas Fuerte</p>
            <p className="mt-3 text-3xl font-bold text-sky-300">{peakDay.day}</p>
            <p className="mt-2 text-sm text-slate-400">
              {peakDay.productsSold.toLocaleString("es-CO")} productos vendidos
            </p>
            <p className="text-sm text-slate-400">${peakDay.revenue.toLocaleString("es-CO")} en ventas</p>
            <p className="text-sm text-slate-400">{peakDay.orders} pedidos</p>
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Hora Pico</p>
            <p className="mt-3 text-3xl font-bold text-green-400">
              {String(salesData[0]?.peakHour).padStart(2, "0")}:00
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {peakDay.peakProductsSold.toLocaleString("es-CO")} productos vendidos
            </p>
            <p className="text-sm text-slate-400">${peakDay.peakRevenue.toLocaleString("es-CO")} en ingresos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
