import { sql } from "@/app/Datalibs/database";
import { FiShoppingBag, FiTruck } from "react-icons/fi";

interface MonthlyBreakdownProps {
  quarter: number;
  year: number;
}

interface MonthlySales {
  month: number;
  monthName: string;
  revenue: number;
  orders: number;
  productsSold: number;
  avgTicket: number;
  delivery: number;
  pickUp: number;
}

async function getMonthlySalesData(quarter: number, year: number): Promise<MonthlySales[]> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const months = [
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

    const { rows: monthlySalesData } = await sql<{
      month: number;
      revenue: number;
      orders: number;
      products_sold: number;
      delivery: number;
      pickup: number;
    }>(`
      WITH paid_orders AS (
        SELECT DISTINCT ON (ped.id_pedido)
          ped.id_pedido,
          ped.tipo_entrega,
          ped.total,
          COALESCE(pg.fecha_pago, ent.fecha_entrega, ent.fecha_hora_retiro, ped.fecha_creacion) AS report_date
        FROM public.pedido ped
        JOIN public.pago pg ON pg.id_pedido = ped.id_pedido
        LEFT JOIN public.entrega ent ON ent.id_pedido = ped.id_pedido
        WHERE LOWER(pg.estado_pago) = 'pagado'
          AND EXTRACT(MONTH FROM COALESCE(pg.fecha_pago, ent.fecha_entrega, ent.fecha_hora_retiro, ped.fecha_creacion)) BETWEEN $1 AND $2
          AND EXTRACT(YEAR FROM COALESCE(pg.fecha_pago, ent.fecha_entrega, ent.fecha_hora_retiro, ped.fecha_creacion)) = $3
        ORDER BY ped.id_pedido, pg.fecha_pago DESC NULLS LAST, pg.id_pago DESC
      ),
      monthly_orders AS (
        SELECT
          EXTRACT(MONTH FROM report_date)::int AS month,
          COALESCE(SUM(total), 0)::double precision AS revenue,
          COUNT(*)::int AS orders,
          COALESCE(SUM(CASE WHEN LOWER(COALESCE(tipo_entrega, '')) = 'domicilio' THEN 1 ELSE 0 END), 0)::int AS delivery,
          COALESCE(SUM(CASE WHEN LOWER(COALESCE(tipo_entrega, '')) IN ('retiro_tienda', 'retiro', 'pickup', 'en_tienda') THEN 1 ELSE 0 END), 0)::int AS pickup
        FROM paid_orders
        GROUP BY EXTRACT(MONTH FROM report_date)
      ),
      monthly_products AS (
        SELECT
          EXTRACT(MONTH FROM po.report_date)::int AS month,
          COALESCE(SUM(dp.cantidad), 0)::double precision AS products_sold
        FROM paid_orders po
        JOIN public.detalle_pedido dp ON dp.id_pedido = po.id_pedido
        GROUP BY EXTRACT(MONTH FROM po.report_date)
      )
      SELECT
        mo.month,
        mo.revenue,
        mo.orders,
        COALESCE(mp.products_sold, 0)::double precision AS products_sold,
        mo.delivery,
        mo.pickup
      FROM monthly_orders mo
      LEFT JOIN monthly_products mp ON mp.month = mo.month
      ORDER BY mo.month
    `, [monthStart, monthEnd, year]);

    return monthlySalesData.map((row) => ({
      month: row.month,
      monthName: months[row.month - 1],
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      productsSold: Number(row.products_sold),
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

  const maxRevenue = Math.max(...monthlyData.map((month) => month.revenue), 1);

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Desglose Mensual</h2>
        <p className="mt-2 text-sm text-slate-400">
          Comparacion de ventas pagadas, productos vendidos, pedidos y tipos de entrega por mes
        </p>
      </div>

      <div className="space-y-4">
        {monthlyData.map((month) => (
          <div key={month.month} className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <div className="mb-4 grid gap-4 sm:grid-cols-6">
              <div className="col-span-1">
                <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Mes</p>
                <p className="mt-2 text-lg font-bold text-white">{month.monthName}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Ventas</p>
                <p className="mt-2 text-lg font-bold text-sky-300">${month.revenue.toLocaleString("es-CO")}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Pedidos</p>
                <p className="mt-2 text-lg font-bold text-white">{month.orders.toLocaleString("es-CO")}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Productos</p>
                <p className="mt-2 text-lg font-bold text-white">{month.productsSold.toLocaleString("es-CO")}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Ticket Promedio</p>
                <p className="mt-2 text-lg font-bold text-white">${month.avgTicket.toLocaleString("es-CO")}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Entregas</p>
                <p className="mt-2 space-y-2 text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <FiTruck className="h-4 w-4 text-sky-300" />
                    {month.delivery.toLocaleString("es-CO")} domicilio
                  </span>
                  <span className="flex items-center gap-2 text-slate-300">
                    <FiShoppingBag className="h-4 w-4 text-emerald-300" />
                    {month.pickUp.toLocaleString("es-CO")} retiro en tienda
                  </span>
                </p>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800/30">
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
