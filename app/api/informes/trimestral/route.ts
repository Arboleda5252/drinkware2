import { NextRequest, NextResponse } from "next/server";
import { getQuarterStats, normalizeQuarterParams } from "./data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { quarter, year } = normalizeQuarterParams(
      searchParams.get("quarter"),
      searchParams.get("year")
    );

    const stats = await getQuarterStats(quarter, year);
    return NextResponse.json({ ok: true, data: stats });
  } catch (error) {
    console.error("[GET /api/informes/trimestral]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener el informe trimestral" },
      { status: 500 }
    );
  }
}
