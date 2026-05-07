import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

interface GastoRow {
  id: number;
  trimestre: number;
  año: number;
  concepto: string;
  descripcion: string | null;
  monto: number;
  estado: "pagado" | "pendiente";
  fecha_pago: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const quarter = Number(url.searchParams.get("quarter"));
    const year = Number(url.searchParams.get("year"));

    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return NextResponse.json(
        { ok: false, error: "Trimestre inválido" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 2000) {
      return NextResponse.json(
        { ok: false, error: "Año inválido" },
        { status: 400 }
      );
    }

    const { rows: gastos } = await sql<GastoRow>(`
      SELECT
        id,
        trimestre,
        año,
        concepto,
        descripcion,
        monto::numeric AS monto,
        estado,
        fecha_pago
      FROM public.gastos_operacionales
      WHERE trimestre = $1 AND año = $2
      ORDER BY estado DESC, concepto ASC;
    `, [quarter, year]);

    // Separar gastos pagados y pendientes
    const gastosPagados = gastos.filter(g => g.estado === "pagado");
    const gastosPendientes = gastos.filter(g => g.estado === "pendiente");

    const totalPagado = gastosPagados.reduce((sum, g) => sum + Number(g.monto), 0);
    const totalPendiente = gastosPendientes.reduce((sum, g) => sum + Number(g.monto), 0);

    return NextResponse.json({
      ok: true,
      data: {
        trimestre: quarter,
        año: year,
        gastos: gastos.map(g => ({
          ...g,
          monto: Number(g.monto)
        })),
        pagados: gastosPagados.map(g => ({
          ...g,
          monto: Number(g.monto)
        })),
        pendientes: gastosPendientes.map(g => ({
          ...g,
          monto: Number(g.monto)
        })),
        totalPagado: Number(totalPagado),
        totalPendiente: Number(totalPendiente),
        totalGastos: Number(totalPagado + totalPendiente)
      }
    });
  } catch (error) {
    console.error("[gastos-trimestre] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener gastos" },
      { status: 500 }
    );
  }
}
