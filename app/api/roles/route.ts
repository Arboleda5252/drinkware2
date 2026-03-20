import { NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { rows } = await sql(`SELECT id_rol, rol FROM user_rol ORDER BY rol ASC`);
    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Error al obtener roles' }, { status: 500 });
  }
}