import { NextRequest, NextResponse } from "next/server";
import { getQuarterExpenses, normalizeQuarterParams } from "../data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { quarter, year } = normalizeQuarterParams(
      searchParams.get("quarter"),
      searchParams.get("year")
    );

    const expenses = await getQuarterExpenses(quarter, year);
    return NextResponse.json({ ok: true, data: expenses });
  } catch (error) {
    console.error("[GET /api/informes/trimestral/gastos]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener los gastos del trimestre" },
      { status: 500 }
    );
  }
}
