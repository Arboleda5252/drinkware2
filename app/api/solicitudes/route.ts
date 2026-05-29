import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Solicitud = {
  id: number;
  nombre: string;
  correo: string;
  mensaje: string;
  respuesta: string | null;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  try {
    const { rows } = await sql<Solicitud>(`
      SELECT
        id,
        nombre,
        correo,
        mensaje,
        respuesta
      FROM public.solicitudes
      ORDER BY id DESC;
    `);

    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    console.error("[solicitudes] Error al listar solicitudes", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar solicitudes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Cuerpo de la solicitud invalido" },
        { status: 400 }
      );
    }

    const nombre = textValue(body.nombre);
    const correo = textValue(body.correo);
    const mensaje = textValue(body.mensaje);

    if (!nombre) {
      return NextResponse.json(
        { ok: false, error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (!correo || !isValidEmail(correo)) {
      return NextResponse.json(
        { ok: false, error: "Ingresa un correo valido" },
        { status: 400 }
      );
    }

    if (!mensaje) {
      return NextResponse.json(
        { ok: false, error: "El mensaje es obligatorio" },
        { status: 400 }
      );
    }

    const { rows } = await sql<Solicitud>(
      `
        INSERT INTO public.solicitudes (nombre, correo, mensaje)
        VALUES ($1, $2, $3)
        RETURNING id, nombre, correo, mensaje, respuesta;
      `,
      [nombre, correo, mensaje]
    );

    return NextResponse.json({ ok: true, data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[solicitudes] Error al crear solicitud", error);
    return NextResponse.json(
      { ok: false, error: "Error al enviar la solicitud" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Cuerpo de la solicitud invalido" },
        { status: 400 }
      );
    }

    const id = Number(body.id);
    const respuesta = textValue(body.respuesta);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "El id de la solicitud es obligatorio" },
        { status: 400 }
      );
    }

    if (!respuesta) {
      return NextResponse.json(
        { ok: false, error: "La respuesta es obligatoria" },
        { status: 400 }
      );
    }

    const { rows } = await sql<Solicitud>(
      `
        UPDATE public.solicitudes
        SET respuesta = $2
        WHERE id = $1
        RETURNING id, nombre, correo, mensaje, respuesta;
      `,
      [id, respuesta]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[solicitudes] Error al responder solicitud", error);
    return NextResponse.json(
      { ok: false, error: "Error al responder la solicitud" },
      { status: 500 }
    );
  }
}
