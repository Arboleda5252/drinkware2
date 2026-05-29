import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type TopLiquorRow = {
  id: number;
  name: string | null;
  category: string | null;
  sold: number;
  revenue: number;
  share: number;
};

function normalizeMonth(value: string | null) {
  const month = Number(value);
  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    return month;
  }
  return new Date().getMonth() + 1;
}

function normalizeYear(value: string | null) {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2020 && year <= 2100) {
    return year;
  }
  return new Date().getFullYear();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = normalizeMonth(searchParams.get("month"));
    const year = normalizeYear(searchParams.get("year"));

    const { rows } = await sql<TopLiquorRow>(
      `
        WITH monthly_sales AS (
          SELECT
            prod.idproducto AS id,
            prod.nombre AS name,
            prod.categoria AS category,
            COALESCE(SUM(dp.cantidad), 0)::double precision AS sold,
            COALESCE(SUM(dp.subtotal), 0)::double precision AS revenue
          FROM public.detalle_pedido dp
          JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
          JOIN public.producto prod ON dp.id_producto = prod.idproducto
          WHERE EXTRACT(MONTH FROM ped.fecha_creacion) = $1
            AND EXTRACT(YEAR FROM ped.fecha_creacion) = $2
            AND EXISTS (
              SELECT 1
              FROM public.pago pg
              WHERE pg.id_pedido = ped.id_pedido
                AND LOWER(pg.estado_pago) = 'pagado'
            )
          GROUP BY prod.idproducto, prod.nombre, prod.categoria
        ),
        ranked_sales AS (
          SELECT
            id,
            name,
            category,
            sold,
            revenue,
            COALESCE(SUM(sold) OVER (), 0) AS total_sold
          FROM monthly_sales
          ORDER BY sold DESC, revenue DESC
          LIMIT 10
        )
        SELECT
          id,
          name,
          category,
          sold,
          revenue,
          CASE
            WHEN total_sold > 0 THEN ROUND(((sold / total_sold) * 100)::numeric, 1)::double precision
            ELSE 0
          END AS share
        FROM ranked_sales
        ORDER BY sold DESC, revenue DESC;
      `,
      [month, year]
    );

    return NextResponse.json({
      ok: true,
      data: {
        month,
        year,
        topLicores: rows.map((row) => ({
          id: Number(row.id),
          name: row.name || "Producto sin nombre",
          category: row.category || "Sin categoria",
          sold: Number(row.sold),
          revenue: Number(row.revenue),
          share: Number(row.share),
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/informes/top-10-licores]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error al cargar el Top 10 de licores",
      },
      { status: 500 }
    );
  }
}
