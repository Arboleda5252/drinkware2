import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/app/Datalibs/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { nombreusuario, password } = await req.json();
    const result = await authenticateUser(nombreusuario, password);

    if (!result.ok) {
      const status = result.status ?? 401;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    const response = NextResponse.json({
      ok: true,
      user: result.user,
      activated: result.activated,
    });

    response.cookies.set({
      name: "session",
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error del servidor" }, { status: 500 });
  }
}