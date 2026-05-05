import { sql } from "@/app/Datalibs/database";

interface DeliveryAnalysisProps {
  quarter: number;
  year: number;
}

interface DeliveryStats {
  type: string;
  orders: number;
  revenue: number;
  avgTicket: number;
  percentage: number;
}

async function getDeliveryAnalysis(quarter: number, year: number): Promise<DeliveryStats[]> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const { rows: deliveryData } = await sql<{
      tipo_entrega: string;
      orders: number;
      revenue: number;
    }>(`
      SELECT
        CASE 
          WHEN p.tipo_entrega = 'domicilio' THEN 'Domicilio'
          WHEN p.tipo_entrega IN ('retiro', 'pickup', 'en_tienda') THEN 'Retiro en Tienda'
          ELSE 'Otro'
        END as tipo_entrega,
        COUNT(DISTINCT p.id_pedido) as orders,
        COALESCE(SUM(dp.subtotal), 0) as revenue
      FROM public.pedido p
      LEFT JOIN public.detalle_pedido dp ON p.id_pedido = dp.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
      GROUP BY tipo_entrega
    `, [monthStart, monthEnd, year]);

    const totalOrders = deliveryData.reduce((sum, d) => sum + Number(d.orders), 0);
    const totalRevenue = deliveryData.reduce((sum, d) => sum + Number(d.revenue), 0);

    return deliveryData.map(d => ({
      type: d.tipo_entrega,
      orders: Number(d.orders),
      revenue: Number(d.revenue),
      avgTicket: Number(d.orders) > 0 ? Math.round(Number(d.revenue) / Number(d.orders)) : 0,
      percentage: totalOrders > 0 ? Math.round((Number(d.orders) / totalOrders) * 100) : 0,
    })).sort((a, b) => b.orders - a.orders);
  } catch (error) {
    console.error("Error obteniendo análisis de entrega:", error);
    return [];
  }
}

export default async function DeliveryAnalysis({ quarter, year }: DeliveryAnalysisProps) {
  const deliveryStats = await getDeliveryAnalysis(quarter, year);

  if (deliveryStats.length === 0) {
    return null;
  }

  const totalOrders = deliveryStats.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = deliveryStats.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Análisis de Tipos de Entrega</h2>
        <p className="mt-2 text-sm text-slate-400">Comparación entre domicilio y retiro en tienda</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Summary */}
        <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
          <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Total Pedidos</p>
          <p className="mt-3 text-3xl font-bold text-white">{totalOrders.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-400">Todos los tipos combinados</p>
        </div>

        <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
          <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Ingresos Totales</p>
          <p className="mt-3 text-3xl font-bold text-sky-300">${totalRevenue.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-400">Por todos los canales</p>
        </div>

        <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
          <p className="text-sm text-slate-400 uppercase tracking-[0.15em]">Ticket Promedio</p>
          <p className="mt-3 text-3xl font-bold text-green-400">
            ${(totalRevenue / totalOrders).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-sm text-slate-400">General</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {deliveryStats.map((delivery) => (
          <div key={delivery.type} className="rounded-2xl border border-slate-800/50 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-white">{delivery.type}</p>
                <p className="mt-1 text-2xl font-bold text-sky-300">{delivery.percentage}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">del total</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/30">
              <div>
                <p className="text-xs text-slate-400">Pedidos</p>
                <p className="mt-2 text-lg font-semibold text-white">{delivery.orders.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Ingresos</p>
                <p className="mt-2 text-lg font-semibold text-white">${delivery.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Ticket Prom.</p>
                <p className="mt-2 text-lg font-semibold text-white">${delivery.avgTicket.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-slate-800/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-sky-500 to-sky-400"
                style={{ width: `${delivery.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

