import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';
import { hashPassword } from '@/app/Datalibs/password';
import { getUserFromSession } from '@/app/Datalibs/auth';

export const runtime = 'nodejs';

type UsuarioListado = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  documento: string;
  nombreusuario: string;
  rol: string | null;
  activo: boolean;
};

type UsuarioExistente = {
  idusuario: number;
};

// GET
export async function GET() {
  try {
    const { rows } = await sql<UsuarioListado>(`
      SELECT
        u.idusuario AS id,
        u.nombre,
        u.apellido,
        u.email AS correo,
        u.documento,
        u.nombreusuario,
        r.rol,
        u.activo
      FROM usuario AS u
      LEFT JOIN user_rol AS r ON r.id_rol = u.id_rol
      ORDER BY u.apellido, u.nombre;
    `);

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al listar usuarios' },
      { status: 500 }
    );
  }
}

// POST
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 });
  }

  const campos = [
    'nombre', 'apellido', 'tipo_documento', 'documento', 'telefono', 'correo', 'ciudad', 'direccion',
    'nombreusuario', 'password', 'fecha_nacimiento', 'id_rol', 'activo'
  ];
  const columnas = [];
  const valores = [];
  for (const campo of campos) {
    if (body[campo] !== undefined && body[campo] !== null && body[campo] !== "") {
      if (campo === 'correo') {
        columnas.push('email');
      } else {
        columnas.push(campo);
      }
      valores.push(body[campo]);
    }
  }

  // Validación campos obligatorios
  const obligatorios = ['nombre', 'apellido', 'tipo_documento', 'documento', 'telefono', 'correo', 'ciudad', 'direccion', 'nombreusuario', 'password', 'fecha_nacimiento', 'id_rol'];
  for (const campo of obligatorios) {
    if (!body[campo] || body[campo] === "") {
      return NextResponse.json({ ok: false, error: `Falta el campo obligatorio: ${campo}` }, { status: 400 });
    }
  }

  const sessionUser = await getUserFromSession().catch(() => null);
  const canAssignRole = sessionUser?.id_rol === 2;
  if (!canAssignRole) {
    const roleIndex = columnas.indexOf('id_rol');
    if (roleIndex >= 0) {
      valores[roleIndex] = 1;
    }

    const activeIndex = columnas.indexOf('activo');
    if (activeIndex >= 0) {
      valores[activeIndex] = true;
    }
  }

  try {
    const { rows: existingUsers } = await sql<UsuarioExistente>(
      `
        SELECT idusuario
        FROM usuario
        WHERE documento = $1 OR LOWER(nombreusuario) = LOWER($2)
        LIMIT 1;
      `,
      [body.documento, body.nombreusuario]
    );

    if (existingUsers[0]) {
      return NextResponse.json(
        { ok: false, error: 'El documento o nombre de usuario ya esta registrado' },
        { status: 409 }
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Error al validar usuario' }, { status: 500 });
  }

  const passwordIndex = columnas.indexOf('password');
  if (passwordIndex >= 0) {
    valores[passwordIndex] = await hashPassword(String(valores[passwordIndex]));
  }

  const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
  const query = `INSERT INTO usuario (${columnas.join(', ')}) VALUES (${placeholders}) RETURNING idusuario`;
  try {
    const result = await sql(query, valores);
    return NextResponse.json({ ok: true, id: result.rows[0]?.idusuario });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Error al crear usuario' }, { status: 500 });
  }
}
