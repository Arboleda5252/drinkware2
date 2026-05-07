import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const month = Number(url.searchParams.get("month"));
    const year = Number(url.searchParams.get("year"));

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Mes inválido" }, { status: 400 });
    }

    if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear()) {
      return NextResponse.json({ ok: false, error: "Año inválido" }, { status: 400 });
    }

    const { rows } = await sql<{
      idproducto: number;
      nombre: string;
      categoria: string | null;
      total_sold: number;
      total_revenue: number;
    }>(`
      SELECT
        p.idproducto,
        p.nombre,
        p.categoria,
        COALESCE(SUM(dp.cantidad), 0) AS total_sold,
        COALESCE(SUM(dp.subtotal), 0) AS total_revenue
      FROM public.detalle_pedido dp
      JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      JOIN public.producto p ON dp.id_producto = p.idproducto
      WHERE p.estados = 'Disponible'
        AND EXTRACT(MONTH FROM ped.fecha_creacion) = $1
        AND EXTRACT(YEAR FROM ped.fecha_creacion) = $2
      GROUP BY p.idproducto, p.nombre, p.categoria
      ORDER BY total_sold DESC, total_revenue DESC
      LIMIT 10;
    `, [month, year]);

    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.total_revenue), 0);
    const topLicores = rows.map((row) => ({
      id: Number(row.idproducto),
      name: row.nombre,
      category: row.categoria || "Sin categoría",
      sold: Number(row.total_sold),
      revenue: Number(row.total_revenue),
      share: totalRevenue > 0 ? Math.round((Number(row.total_revenue) / totalRevenue) * 100) : 0,
    }));

    return NextResponse.json({ ok: true, data: { topLicores } });
  } catch (error) {
    console.error("[top-10-licores] Error al obtener el Top 10:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener el Top 10 de licores" }, { status: 500 });
  }
}
