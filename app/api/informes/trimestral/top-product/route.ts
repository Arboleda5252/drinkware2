import { NextRequest, NextResponse } from "next/server";
import { getTopProduct, normalizeQuarterParams } from "../data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { quarter, year } = normalizeQuarterParams(
      searchParams.get("quarter"),
      searchParams.get("year")
    );

    const product = await getTopProduct(quarter, year);
    return NextResponse.json({ ok: true, data: { product } });
  } catch (error) {
    console.error("[GET /api/informes/trimestral/top-product]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener el producto mas vendido" },
      { status: 500 }
    );
  }
}
