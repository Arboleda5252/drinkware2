import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const documentoInput = typeof body?.documento === "string" ? body.documento.trim() : "";
    const idUsuarioRaw = body?.idUsuario ?? body?.idusuario ?? body?.usuarioId ?? body?.usuario_id;
    const idUsuario = Number(idUsuarioRaw);

    if (!documentoInput) {
      return NextResponse.json(
        { ok: false, error: "documento es requerido" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json(
        { ok: false, error: "idUsuario debe ser un entero positivo" },
        { status: 400 }
      );
    }

    const { rows } = await sql<{ id: number }>(
      `
        UPDATE public.detallepedido
        SET idusuario = $2
        WHERE documento = $1 AND (idusuario IS NULL OR idusuario = 0)
        RETURNING iddetallepedido AS id;
      `,
      [documentoInput, idUsuario]
    );

    return NextResponse.json({ ok: true, adoptados: rows.length });
  } catch (error) {
    console.error("[POST /api/Detallepedido/adoptar]", error);
    return NextResponse.json(
      { ok: false, error: "Error al asociar los pedidos previos" },
      { status: 500 }
    );
  }
}