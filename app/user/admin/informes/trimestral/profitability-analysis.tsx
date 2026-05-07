import { sql } from "@/app/Datalibs/database";
import ProfitabilityAnalysisClient, { ProfitabilitySummaryData } from "./profitability-analysis-client";

interface ProfitabilityAnalysisProps {
  quarter: number;
  year: number;
}

async function getProfitabilityAnalysis(quarter: number, year: number): Promise<ProfitabilitySummaryData> {
  try {
    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const { rows: revenueData } = await sql<{ total_revenue: number }>(`
      SELECT
        COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      WHERE EXTRACT(MONTH FROM p.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM p.fecha_creacion) = $3
    `, [monthStart, monthEnd, year]);

    const totalIngresos = Number(revenueData[0]?.total_revenue) || 0;
    const ivaRecaudado = Math.round(totalIngresos * 0.19);

    const { rows: costData } = await sql<{ total_cost: number }>(`
      SELECT
        COALESCE(SUM(dp.cantidad * COALESCE(p.costo, p.precio * 0.35)), 0) as total_cost
      FROM public.detalle_pedido dp
      JOIN public.producto p ON dp.id_producto = p.idproducto
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
    `, [monthStart, monthEnd, year]);

    const costoProductos = Number(costData[0]?.total_cost) || 0;
    const gananciaBruta = totalIngresos - costoProductos;

    const { rows: gastosData } = await sql<{
      total_pagado: number;
      total_pendiente: number;
    }>(`
      SELECT
        COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0) as total_pagado,
        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END), 0) as total_pendiente
      FROM public.gastos_operacionales
      WHERE trimestre = $1 AND año = $2
    `, [quarter, year]);

    const gastosPagados = Number(gastosData[0]?.total_pagado) || 0;
    const gastosPendientes = Number(gastosData[0]?.total_pendiente) || 0;
    const gananciaNeta = gananciaBruta - gastosPagados;
    const gananciaNetaTeorica = gananciaBruta - (gastosPagados + gastosPendientes);
    const margenNeto = totalIngresos > 0 ? Math.round((gananciaNeta / totalIngresos) * 100) : 0;

    return {
      totalIngresos,
      ivaRecaudado,
      costoProductos,
      gananciaBruta,
      gastosPagados,
      gastosPendientes,
      gananciaNeta,
      gananciaNetaTeorica,
      margenNeto,
    };
  } catch (error) {
    console.error("Error obteniendo análisis de rentabilidad:", error);
    return {
      totalIngresos: 0,
      ivaRecaudado: 0,
      costoProductos: 0,
      gananciaBruta: 0,
      gastosPagados: 0,
      gastosPendientes: 0,
      gananciaNeta: 0,
      gananciaNetaTeorica: 0,
      margenNeto: 0,
    };
  }
}

export default async function ProfitabilityAnalysis({ quarter, year }: ProfitabilityAnalysisProps) {
  const summary = await getProfitabilityAnalysis(quarter, year);

  return (
    <ProfitabilityAnalysisClient quarter={quarter} year={year} summary={summary} />
  );
}

