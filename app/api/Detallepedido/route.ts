import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { getUserFromSession } from "@/app/Datalibs/auth";
import { DatabaseError } from "pg";

export const runtime = "nodejs";

type DetallePedidoRow = {
  id: number;
  productoId: number;
  cantidad: number;
  precioProducto: number;
  subtotal: number;
  idUsuario: number | null;
  idVendedor: number | null;
  fechaPago: string | null;
  estado: string | null;
  nombreCliente: string | null;
  direccionCliente: string | null;
  telefonoCliente: string | null;
  documento: string | null;
};

const baseSelect = `
  SELECT
    iddetallepedido AS id,
    id_producto AS "productoId",
    cantidad,
    precioproducto AS "precioProducto",
    subtotal,
    idusuario AS "idUsuario",
    idvendedor AS "idVendedor",
    fechapago AS "fechaPago",
    estado,
    nombre_cliente AS "nombreCliente",
    direccion_cliente AS "direccionCliente",
    telefono_cliente AS "telefonoCliente",
    documento
  FROM public.detallepedido
`;

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

const toDto = (row: DetallePedidoRow) => ({
  id: row.id,
  productoId: row.productoId,
  cantidad: row.cantidad,
  precioProducto: Number(row.precioProducto),
  subtotal: Number(row.subtotal),
  idUsuario: row.idUsuario === null ? null : Number(row.idUsuario),
  idVendedor: row.idVendedor === null ? null : Number(row.idVendedor),
  fechaPago: row.fechaPago,
  estado: row.estado,
  nombreCliente: row.nombreCliente,
  direccionCliente: row.direccionCliente,
  telefonoCliente: row.telefonoCliente,
  documento: row.documento,
});

// GET
export async function GET() {
  try {
    const { rows } = await sql<DetallePedidoRow>(`${baseSelect} ORDER BY iddetallepedido DESC;`);
    return NextResponse.json({ ok: true, data: rows.map(toDto) });
  } catch (error) {
    console.error("[GET /api/Detallepedido]", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar detalle de pedidos" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionUser = await getUserFromSession();

    const productoId = Number(
      body?.productoId ?? body?.id_producto ?? body?.idProducto ?? body?.idproducto
    );
    const cantidad = Number(body?.cantidad);
    const precioProducto = Number(
      body?.precioProducto ?? body?.precioproducto ?? body?.precio_producto ?? body?.precio
    );
    if (!Number.isInteger(productoId) || productoId <= 0) {
      return NextResponse.json(
        { ok: false, error: "id_producto debe ser un entero positivo" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return NextResponse.json(
        { ok: false, error: "cantidad debe ser un entero positivo" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(precioProducto) || precioProducto < 0) {
      return NextResponse.json(
        { ok: false, error: "precioproducto debe ser un numero valido" },
        { status: 400 }
      );
    }

    const columns: string[] = ["id_producto", "cantidad", "precioproducto"];
    const values: any[] = [productoId, cantidad, precioProducto];

    const addColumn = (column: string, value: any) => {
      columns.push(column);
      values.push(value);
    };

    const usuarioInput =
      body?.idUsuario ?? body?.idusuario ?? body?.id_usuario ?? body?.usuarioId ?? body?.usuario_id;
    if (usuarioInput !== undefined) {
      if (usuarioInput === null) {
        addColumn("idusuario", null);
      } else {
        const idUsuario = Number(usuarioInput);
        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
          return NextResponse.json(
            { ok: false, error: "idusuario debe ser un entero positivo o null" },
            { status: 400 }
          );
        }
        addColumn("idusuario", idUsuario);
      }
    }

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
    addColumn("idvendedor", sessionUser.idusuario);

    const fechaPagoInput = body?.fechaPago ?? body?.fechapago ?? body?.fecha_pago;
    if (fechaPagoInput !== undefined) {
      if (fechaPagoInput === null) {
        addColumn("fechapago", null);
      } else if (typeof fechaPagoInput === "string" && fechaPagoInput.trim().length > 0) {
        const timestamp = Date.parse(fechaPagoInput);
        if (Number.isNaN(timestamp)) {
          return NextResponse.json(
            { ok: false, error: "fechapago debe ser una fecha valida (YYYY-MM-DD)" },
            { status: 400 }
          );
        }
        addColumn("fechapago", fechaPagoInput);
      } else {
        return NextResponse.json(
          { ok: false, error: "fechapago debe ser una fecha valida o null" },
          { status: 400 }
        );
      }
    }

    const estadoInput = body?.estado;
    if (estadoInput !== undefined) {
      if (estadoInput === null) {
        addColumn("estado", null);
      } else if (typeof estadoInput === "string" && estadoInput.trim().length > 0) {
        addColumn("estado", estadoInput.trim());
      } else {
        return NextResponse.json(
          { ok: false, error: "estado debe ser un texto no vacio o null" },
          { status: 400 }
        );
      }
    }

    const nombreInput = body?.nombreCliente ?? body?.nombre_cliente;
    if (nombreInput !== undefined) {
      if (nombreInput === null) {
        addColumn("nombre_cliente", null);
      } else if (typeof nombreInput === "string" && nombreInput.trim().length > 0) {
        addColumn("nombre_cliente", nombreInput.trim());
      } else {
        return NextResponse.json(
          { ok: false, error: "nombre_cliente debe ser un texto no vacio o null" },
          { status: 400 }
        );
      }
    }

    const direccionInput = body?.direccionCliente ?? body?.direccion_cliente;
    if (direccionInput !== undefined) {
      if (direccionInput === null) {
        addColumn("direccion_cliente", null);
      } else if (typeof direccionInput === "string" && direccionInput.trim().length > 0) {
        addColumn("direccion_cliente", direccionInput.trim());
      } else {
        return NextResponse.json(
          { ok: false, error: "direccion_cliente debe ser un texto no vacio o null" },
          { status: 400 }
        );
      }
    }

    const telefonoInput = body?.telefonoCliente ?? body?.telefono_cliente;
    if (telefonoInput !== undefined) {
      if (telefonoInput === null) {
        addColumn("telefono_cliente", null);
      } else if (typeof telefonoInput === "string" && telefonoInput.trim().length > 0) {
        addColumn("telefono_cliente", telefonoInput.trim());
      } else {
        return NextResponse.json(
          { ok: false, error: "telefono_cliente debe ser un texto no vacio o null" },
          { status: 400 }
        );
      }
    }

    const documentoInput = body?.documento ?? body?.documentoCliente ?? body?.documento_cliente;
    if (documentoInput !== undefined) {
      if (documentoInput === null) {
        addColumn("documento", null);
      } else if (typeof documentoInput === "string" && documentoInput.trim().length > 0) {
        addColumn("documento", documentoInput.trim());
      } else {
        return NextResponse.json(
          { ok: false, error: "documento debe ser un texto no vacio o null" },
          { status: 400 }
        );
      }
    }

    const placeholders = columns.map((_, idx) => `$${idx + 1}`);

    const { rows } = await sql<DetallePedidoRow>(
      `
        INSERT INTO public.detallepedido
          (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING
          iddetallepedido AS id,
          id_producto AS "productoId",
          cantidad,
          precioproducto AS "precioProducto",
          subtotal,
          idusuario AS "idUsuario",
          idvendedor AS "idVendedor",
          fechapago AS "fechaPago",
          estado,
          nombre_cliente AS "nombreCliente",
          direccion_cliente AS "direccionCliente",
          telefono_cliente AS "telefonoCliente",
          documento;
      `,
      values
    );

    return NextResponse.json({ ok: true, data: toDto(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/Detallepedido]", error);
    const { message, status } = mapDetallePedidoError(error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"]);

// Errores a respuestas HTTP
function mapDetallePedidoError(error: unknown) {
  if (error instanceof DatabaseError) {
    if (error.code === "23503") {
      const constraint = error.constraint ?? "";
      if (constraint.includes("idvendedor")) {
        return {
          status: 400,
          message: "El vendedor asociado no existe en la base de datos",
        };
      }
      if (constraint.includes("idusuario")) {
        return {
          status: 400,
          message: "El usuario asociado no existe en la base de datos",
        };
      }
      return {
        status: 400,
        message: "El producto asociado no existe en la base de datos",
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
    message: error instanceof Error ? error.message : "Error al crear detalle de pedido",
  };
}
