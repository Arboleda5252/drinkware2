import { NextResponse } from "next/server";
import { getUserFromSession } from "@/app/Datalibs/auth";

export async function GET() {
  const user = await getUserFromSession();
  return NextResponse.json({ ok: !!user, user });
}
