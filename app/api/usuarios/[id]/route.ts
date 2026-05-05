// app/api/usuario/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';
import { getUserFromSession } from '@/app/Datalibs/auth';

export const runtime = 'nodejs';

type UsuarioRouteParams = Promise<{ id: string }>;

type UsuarioDetalle = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string | null;       
  documento: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  tipo_documento: string | null;
  nombreusuario: string | null;
  fecha_nacimiento: string | null; 
  id_rol: number | null;
  rol: string | null;
};

type RolDetalle = {
  rol: string | null;
};

type DomiciliarioExistente = {
  idDomiciliario: number;
};

type VendedorExistente = {
  idVendedor: number;
};

function parseId(idStr: string): number | null {
  const n = Number(idStr);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function resolveTargetId(idParam: string): Promise<number | null> {
  if (idParam === 'me') {
    const sessionUser = await getUserFromSession();
    return sessionUser?.idusuario ?? null;
  }
  return parseId(idParam);
}

async function syncDomiciliarioByRole(userId: number, roleId: number) {
  const { rows: roleRows } = await sql<RolDetalle>(
    `
      SELECT rol
      FROM user_rol
      WHERE id_rol = $1
      LIMIT 1;
    `,
    [roleId]
  );

  const roleName = roleRows[0]?.rol?.trim().toLowerCase() ?? null;
  if (roleName !== 'domiciliario') {
    return { synced: false, created: false };
  }

  const { rows: domicilioRows } = await sql<DomiciliarioExistente>(
    `
      SELECT id_domiciliario AS "idDomiciliario"
      FROM public.domiciliario
      WHERE id_usuario = $1
      LIMIT 1;
    `,
    [userId]
  );

  if (domicilioRows.length > 0) {
    return { synced: true, created: false };
  }

  await sql(
    `
      INSERT INTO public.domiciliario (id_usuario)
      VALUES ($1);
    `,
    [userId]
  );

  return { synced: true, created: true };
}

async function syncVendedorByRole(userId: number, roleId: number) {
  const { rows: roleRows } = await sql<RolDetalle>(
    `
      SELECT rol
      FROM user_rol
      WHERE id_rol = $1
      LIMIT 1;
    `,
    [roleId]
  );

  const roleName = roleRows[0]?.rol?.trim().toLowerCase() ?? null;
  if (roleName !== 'vendedor') {
    return { synced: false, created: false };
  }

  const { rows: vendedorRows } = await sql<VendedorExistente>(
    `
      SELECT idvendedor AS "idVendedor"
      FROM public.vendedor
      WHERE idvendedor = $1
      LIMIT 1;
    `,
    [userId]
  );

  if (vendedorRows.length > 0) {
    return { synced: true, created: false };
  }

  await sql(
    `
      INSERT INTO public.vendedor (idvendedor, estado, fechaingreso)
      VALUES ($1, $2, NOW())
      ON CONFLICT (idvendedor) DO NOTHING;
    `,
    [userId, true]
  );

  return { synced: true, created: true };
}

// GET
export async function GET(
  _req: NextRequest,
  { params }: { params: UsuarioRouteParams }
) {
  const { id: routeId } = await params;
  const id = await resolveTargetId(routeId);
  if (!id) {
    const status = routeId === 'me' ? 401 : 400;
    const error = routeId === 'me' ? 'No autenticado' : 'ID invalido';
    return NextResponse.json({ ok: false, error }, { status });
  }

  try {
    const { rows } = await sql<UsuarioDetalle>(
      `
      SELECT
        u.idusuario AS id,
        u.nombre,
        u.apellido,
        u.email AS correo,
        u.documento,
        u.telefono,
        u.ciudad,
        u.direccion,
        u.tipo_documento,
        u.nombreusuario,
        u.fecha_nacimiento,
        u.id_rol,
        r.rol
      FROM usuario AS u
      LEFT JOIN user_rol AS r ON r.id_rol = u.id_rol
      WHERE u.idusuario = $1;
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PUT
export async function PUT(req: NextRequest, { params }: { params: UsuarioRouteParams }) {
  const { id: routeId } = await params;
  const id = await resolveTargetId(routeId);
  if (!id) {
    const status = routeId === 'me' ? 401 : 400;
    const error = routeId === 'me' ? 'No autenticado' : 'ID invalido';
    return NextResponse.json({ ok: false, error }, { status });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 });
  }

  const camposPersonales = [
    'nombre', 'apellido', 'correo', 'documento', 'telefono', 'ciudad', 'direccion',
    'tipo_documento', 'nombreusuario', 'fecha_nacimiento', 'mediopago', 'password'
  ];
  const camposActualizar = [];
  const valoresActualizar = [];

  for (const campo of camposPersonales) {
    if (body[campo] !== undefined) {
      camposActualizar.push(`${campo === 'correo' ? 'email' : campo}`);
      valoresActualizar.push(body[campo]);
    }
  }

  if (body.id_rol !== undefined) {
    camposActualizar.push('id_rol');
    valoresActualizar.push(body.id_rol);
  }

  if (camposActualizar.length === 0) {
    return NextResponse.json({ ok: false, error: 'No hay campos para actualizar' }, { status: 400 });
  }

  const setClause = camposActualizar.map((campo, i) => `${campo} = $${i + 1}`).join(', ');
  const query = `UPDATE usuario SET ${setClause} WHERE idusuario = $${camposActualizar.length + 1}`;
  valoresActualizar.push(id);

  try {
    await sql(query, valoresActualizar);

    let domiciliario = { synced: false, created: false };
    let vendedor = { synced: false, created: false };
    if (body.id_rol !== undefined) {
      domiciliario = await syncDomiciliarioByRole(id, Number(body.id_rol));
      vendedor = await syncVendedorByRole(id, Number(body.id_rol));
    }

    return NextResponse.json({
      ok: true,
      message: 'Usuario actualizado',
      domiciliario,
      vendedor,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: UsuarioRouteParams }
) {
  try {
    const { id: routeId } = await params;
    const sessionUser = await getUserFromSession();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    let targetId: number | null = null;
    if (routeId === 'me') {
      targetId = sessionUser.idusuario;
    } else {
      targetId = parseId(routeId);
    }

    if (!targetId) {
      return NextResponse.json({ ok: false, error: 'ID inválido' }, { status: 400 });
    }

    if (targetId !== sessionUser.idusuario) {
      return NextResponse.json({ ok: false, error: 'Prohibido' }, { status: 403 });
    }

    await sql(
      `UPDATE public.usuario
          SET activo = FALSE
        WHERE idusuario = $1`,
      [targetId]
    );

    const res = NextResponse.json({ ok: true, message: 'Cuenta eliminada' });
    res.cookies.delete('session');
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
