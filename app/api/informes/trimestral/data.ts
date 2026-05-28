import { sql } from "@/app/Datalibs/database";

export interface QuarterStats {
  quarter: number;
  year: number;
  totalSales: number;
  totalRevenue: number;
  transactionCount: number;
  avgTicket: number;
  growthPercent: number;
  topCategory: string;
  topProductName: string;
}

export interface TopProductDetails {
  id: number;
  nombre: string;
  categoria: string | null;
  imagen: string | null;
  descripcion: string | null;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface ExpenseRecord {
  id: number;
  trimestre: number;
  year: number;
  concepto: string;
  descripcion: string | null;
  monto: number;
  estado: "pagado" | "pendiente";
  fecha_pago: string | null;
}

export function normalizeQuarterParams(quarterInput: string | null, yearInput: string | null) {
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  const quarter = Number(quarterInput ?? currentQuarter);
  const year = Number(yearInput ?? currentYear);

  return {
    quarter: Number.isInteger(quarter) && quarter >= 1 && quarter <= 4 ? quarter : currentQuarter,
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : currentYear,
  };
}

export function getQuarterMonthRange(quarter: number) {
  return {
    monthStart: (quarter - 1) * 3 + 1,
    monthEnd: quarter * 3,
  };
}

export async function getQuarterStats(quarter: number, year: number): Promise<QuarterStats> {
  const { monthStart, monthEnd } = getQuarterMonthRange(quarter);

  const { rows: salesData } = await sql<{
    total_sales: number;
    total_revenue: number;
    transaction_count: number;
  }>(`
    WITH paid_orders AS (
      SELECT DISTINCT ped.id_pedido, ped.total
      FROM public.pedido ped
      JOIN public.pago pg ON pg.id_pedido = ped.id_pedido
      WHERE LOWER(pg.estado_pago) = 'pagado'
        AND EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
    )
    SELECT
      COALESCE((
        SELECT SUM(dp.cantidad)
        FROM public.detalle_pedido dp
        JOIN paid_orders po ON po.id_pedido = dp.id_pedido
      ), 0)::double precision as total_sales,
      COALESCE(SUM(po.total), 0)::double precision as total_revenue,
      COUNT(po.id_pedido)::int as transaction_count
    FROM paid_orders po
  `, [monthStart, monthEnd, year]);

  const totalRevenue = Number(salesData[0]?.total_revenue) || 0;
  const totalSales = Number(salesData[0]?.total_sales) || 0;
  const transactionCount = Number(salesData[0]?.transaction_count) || 0;
  const avgTicket = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

  const prevQuarter = quarter === 1 ? 4 : quarter - 1;
  const prevYear = quarter === 1 ? year - 1 : year;
  const { monthStart: prevMonthStart, monthEnd: prevMonthEnd } = getQuarterMonthRange(prevQuarter);

  const { rows: prevData } = await sql<{ total_revenue: number }>(`
    SELECT COALESCE(SUM(ped.total), 0)::double precision as total_revenue
    FROM public.pedido ped
    WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
      AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      AND EXISTS (
        SELECT 1
        FROM public.pago pg
        WHERE pg.id_pedido = ped.id_pedido
          AND LOWER(pg.estado_pago) = 'pagado'
      )
  `, [prevMonthStart, prevMonthEnd, prevYear]);

  const prevRevenue = Number(prevData[0]?.total_revenue) || 0;
  const growthPercent = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  const { rows: categoryData } = await sql<{ category: string | null; revenue: number }>(`
    SELECT
      p.categoria as category,
      COALESCE(SUM(dp.subtotal), 0)::double precision as revenue
    FROM public.detalle_pedido dp
    JOIN public.producto p ON dp.id_producto = p.idproducto
    JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
    WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
      AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      AND EXISTS (
        SELECT 1
        FROM public.pago pg
        WHERE pg.id_pedido = ped.id_pedido
          AND LOWER(pg.estado_pago) = 'pagado'
      )
    GROUP BY p.categoria
    ORDER BY revenue DESC
    LIMIT 1
  `, [monthStart, monthEnd, year]);

  const topProduct = await getTopProduct(quarter, year);

  return {
    quarter,
    year,
    totalSales,
    totalRevenue,
    transactionCount,
    avgTicket,
    growthPercent,
    topCategory: categoryData[0]?.category || "N/A",
    topProductName: topProduct?.nombre || "N/A",
  };
}

export async function getTopProduct(quarter: number, year: number): Promise<TopProductDetails | null> {
  const { monthStart, monthEnd } = getQuarterMonthRange(quarter);

  const { rows } = await sql<TopProductDetails>(`
    SELECT
      pr.idproducto AS id,
      pr.nombre,
      pr.categoria,
      pr.imagen,
      pr.descripcion,
      COALESCE(SUM(dp.cantidad), 0)::int AS total_quantity,
      COALESCE(SUM(dp.subtotal), 0)::double precision AS total_revenue,
      COUNT(DISTINCT ped.id_pedido)::int AS order_count
    FROM public.detalle_pedido dp
    JOIN public.producto pr ON dp.id_producto = pr.idproducto
    JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
    WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
      AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      AND EXISTS (
        SELECT 1
        FROM public.pago pg
        WHERE pg.id_pedido = ped.id_pedido
          AND LOWER(pg.estado_pago) = 'pagado'
      )
    GROUP BY pr.idproducto, pr.nombre, pr.categoria, pr.imagen, pr.descripcion
    ORDER BY total_quantity DESC, total_revenue DESC
    LIMIT 1
  `, [monthStart, monthEnd, year]);

  return rows[0] ?? null;
}

export async function getQuarterExpenses(quarter: number, year: number) {
  const { rows } = await sql<ExpenseRecord>(`
    SELECT
      id,
      trimestre,
      "a\u00f1o" AS year,
      concepto,
      descripcion,
      monto::double precision AS monto,
      estado,
      fecha_pago::text AS fecha_pago
    FROM public.gastos_operacionales
    WHERE trimestre = $1 AND "a\u00f1o" = $2
    ORDER BY estado DESC, fecha_pago NULLS LAST, concepto
  `, [quarter, year]);

  return {
    pagados: rows.filter((expense) => expense.estado === "pagado"),
    pendientes: rows.filter((expense) => expense.estado === "pendiente"),
  };
}
