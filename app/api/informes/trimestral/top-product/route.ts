import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const quarter = Number(url.searchParams.get("quarter"));
    const year = Number(url.searchParams.get("year"));

    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4 || !Number.isInteger(year) || year < 2000) {
      return NextResponse.json({ ok: false, error: "Parámetros de trimestre inválidos" }, { status: 400 });
    }

    const monthStart = (quarter - 1) * 3 + 1;
    const monthEnd = quarter * 3;

    const { rows: categoryRows } = await sql<{ category: string }>(`
      SELECT
        p.categoria AS category
      FROM public.detalle_pedido dp
      JOIN public.producto p ON dp.id_producto = p.idproducto
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE p.estados = 'Disponible'
        AND EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
      GROUP BY p.categoria
      ORDER BY COALESCE(SUM(dp.subtotal), 0) DESC
      LIMIT 1;
    `, [monthStart, monthEnd, year]);

    const topCategory = categoryRows[0]?.category;
    if (!topCategory) {
      return NextResponse.json({ ok: true, data: null, message: "No hay categoría elegible para este trimestre" });
    }

    const { rows: productRows } = await sql<{
      id: number;
      nombre: string;
      categoria: string | null;
      imagen: string | null;
      descripcion: string | null;
      total_quantity: number;
      total_revenue: number;
      order_count: number;
    }>(`
      SELECT
        p.idproducto AS id,
        p.nombre,
        p.categoria,
        p.imagen,
        p.descripcion,
        COALESCE(SUM(dp.cantidad), 0) AS total_quantity,
        COALESCE(SUM(dp.subtotal), 0) AS total_revenue,
        COUNT(DISTINCT ped.id_pedido) AS order_count
      FROM public.detalle_pedido dp
      JOIN public.producto p ON dp.id_producto = p.idproducto
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE p.estados = 'Disponible'
        AND EXTRACT(MONTH FROM ped.fecha_creacion) BETWEEN $1 AND $2
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $3
        AND p.categoria = $4
      GROUP BY p.idproducto, p.nombre, p.categoria, p.imagen, p.descripcion
      ORDER BY COALESCE(SUM(dp.cantidad), 0) DESC, COALESCE(SUM(dp.subtotal), 0) DESC
      LIMIT 1;
    `, [monthStart, monthEnd, year, topCategory]);

    const topProduct = productRows[0] || null;

    return NextResponse.json({ ok: true, data: { topCategory, product: topProduct } });
  } catch (error) {
    console.error("[top-product] Error al obtener el producto más vendido:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener el producto más vendido" }, { status: 500 });
  }
}
