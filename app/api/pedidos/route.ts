import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { getUserFromSession } from "@/app/Datalibs/auth";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

type PedidoRow = {
  idPedido: number;
  idCliente: number | null;
  idVendedor: number | null;
  fechaCreacion: string;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  observacion: string | null;
  subtotal: number | string;
  costoEnvio: number | string;
  total: number | string;
};

const baseSelect = `
  SELECT
    id_pedido AS "idPedido",
    id_cliente AS "idCliente",
    id_vendedor AS "idVendedor",
    fecha_creacion AS "fechaCreacion",
    tipo_entrega AS "tipoEntrega",
    estado_pedido AS "estadoPedido",
    observacion,
    subtotal,
    costo_envio AS "costoEnvio",
    total
  FROM public.pedido
`;

const toDto = (row: PedidoRow) => ({
  idPedido: Number(row.idPedido),
  idCliente: row.idCliente === null ? null : Number(row.idCliente),
  idVendedor: row.idVendedor === null ? null : Number(row.idVendedor),
  fechaCreacion: row.fechaCreacion,
  tipoEntrega: row.tipoEntrega,
  estadoPedido: row.estadoPedido,
  observacion: row.observacion,
  subtotal: Number(row.subtotal),
  costoEnvio: Number(row.costoEnvio),
  total: Number(row.total),
});

async function ensureVendedorActivo(id: number) {
  const { rows } = await sql<{ activo: boolean | null }>(
    `
      SELECT u.activo
      FROM public.usuario AS u
      WHERE u.idusuario = $1
      LIMIT 1;
    `,
    [id]
  );

  if (!rows[0]) {
    return { ok: false as const, error: "El usuario vendedor no existe." };
  }

  if (!rows[0].activo) {
    return { ok: false as const, error: "El usuario vendedor no esta activo." };
  }

  await sql(
    `
      INSERT INTO public.vendedor (idvendedor, estado, fechaingreso)
      VALUES ($1, $2, NOW())
      ON CONFLICT (idvendedor) DO NOTHING;
    `,
    [id, true]
  );

  return { ok: true as const };
}

export async function GET() {
  try {
    const { rows } = await sql<PedidoRow>(`${baseSelect} ORDER BY id_pedido DESC;`);
    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/pedidos]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar pedidos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionUser = await getUserFromSession();

    if (!sessionUser?.idusuario) {
      return NextResponse.json(
        { ok: false, error: "No hay un vendedor activo en la sesion." },
        { status: 401 }
      );
    }

    const vendedorResult = await ensureVendedorActivo(sessionUser.idusuario);
    if (!vendedorResult.ok) {
      return NextResponse.json(
        { ok: false, error: vendedorResult.error },
        { status: 400 }
      );
    }

    const clienteInput =
      body?.idCliente ?? body?.id_cliente ?? body?.idcliente ?? body?.clienteId ?? body?.cliente_id;
    let idCliente: number | null = null;
    if (clienteInput !== undefined) {
      if (clienteInput !== null && clienteInput !== "") {
        const parsedCliente = Number(clienteInput);
        if (!Number.isInteger(parsedCliente) || parsedCliente <= 0) {
          return NextResponse.json(
            { ok: false, error: "id_cliente debe ser un entero positivo o null" },
            { status: 400 }
          );
        }
        idCliente = parsedCliente;
      }
    }

    const subtotal = Number(body?.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { ok: false, error: "subtotal debe ser un numero valido" },
        { status: 400 }
      );
    }

    const costoEnvioInput = body?.costoEnvio ?? body?.costo_envio;
    const costoEnvio = costoEnvioInput === undefined ? 0 : Number(costoEnvioInput);
    if (!Number.isFinite(costoEnvio) || costoEnvio < 0) {
      return NextResponse.json(
        { ok: false, error: "costo_envio debe ser un numero valido" },
        { status: 400 }
      );
    }

    const tipoEntregaInput = body?.tipoEntrega ?? body?.tipo_entrega;
    const tipoEntrega =
      typeof tipoEntregaInput === "string" && tipoEntregaInput.trim().length > 0
        ? tipoEntregaInput.trim()
        : "Domicilio";

    const estadoPedidoInput = body?.estadoPedido ?? body?.estado_pedido;
    const estadoPedido =
      typeof estadoPedidoInput === "string" && estadoPedidoInput.trim().length > 0
        ? estadoPedidoInput.trim()
        : "Pendiente";

    const observacionInput = body?.observacion;
    const observacion =
      typeof observacionInput === "string" && observacionInput.trim().length > 0
        ? observacionInput.trim()
        : null;

    const fechaCreacionInput = body?.fechaCreacion ?? body?.fecha_creacion;
    if (
      fechaCreacionInput !== undefined &&
      fechaCreacionInput !== null &&
      (typeof fechaCreacionInput !== "string" || Number.isNaN(Date.parse(fechaCreacionInput)))
    ) {
      return NextResponse.json(
        { ok: false, error: "fecha_creacion debe ser una fecha valida o no enviarse" },
        { status: 400 }
      );
    }

    const pedidoInsertWithFecha = `
      INSERT INTO public.pedido
        (
          id_cliente,
          id_vendedor,
          fecha_creacion,
          tipo_entrega,
          estado_pedido,
          observacion,
          subtotal,
          costo_envio,
          total
        )
      VALUES
        (
          $1::integer,
          $2::integer,
          $3::timestamp,
          $4::varchar(20),
          $5::varchar(20),
          $6::text,
          $7::numeric(12,2),
          $8::numeric(12,2),
          ($7::numeric(12,2) + $8::numeric(12,2))::numeric(12,2)
        )
      RETURNING
        id_pedido AS "idPedido",
        id_cliente AS "idCliente",
        id_vendedor AS "idVendedor",
        fecha_creacion AS "fechaCreacion",
        tipo_entrega AS "tipoEntrega",
        estado_pedido AS "estadoPedido",
        observacion,
        subtotal,
        costo_envio AS "costoEnvio",
        total;
    `;

    const pedidoInsertSinFecha = `
      INSERT INTO public.pedido
        (
          id_cliente,
          id_vendedor,
          tipo_entrega,
          estado_pedido,
          observacion,
          subtotal,
          costo_envio,
          total
        )
      VALUES
        (
          $1::integer,
          $2::integer,
          $3::varchar(20),
          $4::varchar(20),
          $5::text,
          $6::numeric(12,2),
          $7::numeric(12,2),
          ($6::numeric(12,2) + $7::numeric(12,2))::numeric(12,2)
        )
      RETURNING
        id_pedido AS "idPedido",
        id_cliente AS "idCliente",
        id_vendedor AS "idVendedor",
        fecha_creacion AS "fechaCreacion",
        tipo_entrega AS "tipoEntrega",
        estado_pedido AS "estadoPedido",
        observacion,
        subtotal,
        costo_envio AS "costoEnvio",
        total;
    `;

    const { rows } = fechaCreacionInput !== undefined && fechaCreacionInput !== null
      ? await sql<PedidoRow>(pedidoInsertWithFecha, [
        idCliente,
        sessionUser.idusuario,
        fechaCreacionInput,
        tipoEntrega,
        estadoPedido,
        observacion,
        subtotal,
        costoEnvio,
      ])
      : await sql<PedidoRow>(pedidoInsertSinFecha, [
        idCliente,
        sessionUser.idusuario,
        tipoEntrega,
        estadoPedido,
        observacion,
        subtotal,
        costoEnvio,
      ]);

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pedidos]", error);
    const { message, status } = mapPedidoError(error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

function mapPedidoError(error: unknown) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      const constraint = error.constraint ?? "";
      if (constraint.includes("id_cliente")) {
        return {
          status: 400,
          message: "El cliente asociado no existe en la base de datos",
        };
      }

      return {
        status: 400,
        message: "El vendedor asociado no existe en la base de datos",
      };
    }

    return {
      status: 500,
      message: error.detail ?? error.message ?? "Error en la base de datos",
    };
  }

  const code = typeof error === "object" && error && "code" in error ? (error as any).code : null;
  if (typeof code === "string" && connectionErrorCodes.has(code)) {
    return {
      status: 503,
      message: "No se pudo conectar a la base de datos. Revisa app/libs/database.ts",
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : "Error al crear pedido",
  };
}