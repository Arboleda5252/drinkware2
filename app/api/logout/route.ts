import { NextResponse } from "next/server";
import { getUserFromSession } from "@/app/Datalibs/auth";
import { sql } from "@/app/Datalibs/database";
export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No hay sesión activa" }, { status: 401 });
    }
    await sql(
      `UPDATE public.usuario
          SET activo = FALSE
        WHERE idusuario = $1`,
      [user.idusuario]
    );
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("session");
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error al cerrar sesión" }, { status: 500 });
  }
}
