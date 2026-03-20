import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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

const selectById = `${baseSelect} WHERE iddetallepedido = $1;`;

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
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<DetallePedidoRow>(selectById, [id]);
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Detalle de pedido no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[GET /api/Detallepedido/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener el detalle de pedido" },
      { status: 500 }
    );
  }
}

// PUT
export async function PUT(req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const updates: string[] = [];
  const values: any[] = [];
  let index = 1;

  const addUpdate = (column: string, value: any) => {
    updates.push(`${column} = $${index++}`);
    values.push(value);
  };

  const productoInput = body?.productoId ?? body?.id_producto ?? body?.idProducto ?? body?.idproducto;
  if (productoInput !== undefined) {
    const productoId = Number(productoInput);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      return NextResponse.json(
        { ok: false, error: "id_producto debe ser un entero positivo" },
        { status: 400 }
      );
    }
    addUpdate("id_producto", productoId);
  }

  if (body?.cantidad !== undefined) {
    const cantidad = Number(body.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return NextResponse.json(
        { ok: false, error: "cantidad debe ser un entero positivo" },
        { status: 400 }
      );
    }
    addUpdate("cantidad", cantidad);
  }

  const precioInput = body?.precioProducto ?? body?.precioproducto ?? body?.precio_producto ?? body?.precio;
  if (precioInput !== undefined) {
    const precio = Number(precioInput);
    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json(
        { ok: false, error: "precioproducto debe ser un numero valido" },
        { status: 400 }
      );
    }
    addUpdate("precioproducto", precio);
  }

  if (body?.subtotal !== undefined) {
    const subtotal = Number(body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { ok: false, error: "subtotal debe ser un numero valido" },
        { status: 400 }
      );
    }
    addUpdate("subtotal", subtotal);
  }

  const usuarioInput =
    body?.idUsuario ?? body?.idusuario ?? body?.id_usuario ?? body?.usuarioId ?? body?.usuario_id;
  if (usuarioInput !== undefined) {
    if (usuarioInput === null) {
      addUpdate("idusuario", null);
    } else {
      const idUsuario = Number(usuarioInput);
      if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return NextResponse.json(
          { ok: false, error: "idusuario debe ser un entero positivo o null" },
          { status: 400 }
        );
      }
      addUpdate("idusuario", idUsuario);
    }
  }

  const vendedorInput =
    body?.idVendedor ?? body?.idvendedor ?? body?.id_vendedor ?? body?.vendedorId ?? body?.vendedor_id;
  if (vendedorInput !== undefined) {
    if (vendedorInput === null) {
      addUpdate("idvendedor", null);
    } else {
      const idVendedor = Number(vendedorInput);
      if (!Number.isInteger(idVendedor) || idVendedor <= 0) {
        return NextResponse.json(
          { ok: false, error: "idvendedor debe ser un entero positivo o null" },
          { status: 400 }
        );
      }
      addUpdate("idvendedor", idVendedor);
    }
  }

  const fechaPagoInput = body?.fechaPago ?? body?.fechapago ?? body?.fecha_pago;
  if (fechaPagoInput !== undefined) {
    if (fechaPagoInput === null) {
      addUpdate("fechapago", null);
    } else if (typeof fechaPagoInput === "string" && fechaPagoInput.trim().length > 0) {
      const timestamp = Date.parse(fechaPagoInput);
      if (Number.isNaN(timestamp)) {
        return NextResponse.json(
          { ok: false, error: "fechapago debe ser una fecha valida (YYYY-MM-DD)" },
          { status: 400 }
        );
      }
      addUpdate("fechapago", fechaPagoInput);
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
      addUpdate("estado", null);
    } else if (typeof estadoInput === "string" && estadoInput.trim().length > 0) {
      addUpdate("estado", estadoInput.trim());
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
      addUpdate("nombre_cliente", null);
    } else if (typeof nombreInput === "string" && nombreInput.trim().length > 0) {
      addUpdate("nombre_cliente", nombreInput.trim());
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
      addUpdate("direccion_cliente", null);
    } else if (typeof direccionInput === "string" && direccionInput.trim().length > 0) {
      addUpdate("direccion_cliente", direccionInput.trim());
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
      addUpdate("telefono_cliente", null);
    } else if (typeof telefonoInput === "string" && telefonoInput.trim().length > 0) {
      addUpdate("telefono_cliente", telefonoInput.trim());
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
      addUpdate("documento", null);
    } else if (typeof documentoInput === "string" && documentoInput.trim().length > 0) {
      addUpdate("documento", documentoInput.trim());
    } else {
      return NextResponse.json(
        { ok: false, error: "documento debe ser un texto no vacio o null" },
        { status: 400 }
      );
    }
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay campos validos para actualizar" },
      { status: 400 }
    );
  }

  values.push(id);

  try {
    const { rows } = await sql<DetallePedidoRow>(
      `
        UPDATE public.detallepedido
        SET ${updates.join(", ")}
        WHERE iddetallepedido = $${index}
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

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Detalle de pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toDto(rows[0]) });
  } catch (error) {
    console.error("[PUT /api/Detallepedido/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el detalle de pedido" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }

  try {
    const { rows } = await sql<{ id: number }>(
      `
        DELETE FROM public.detallepedido
        WHERE iddetallepedido = $1
        RETURNING iddetallepedido AS id;
      `,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Detalle de pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("[DELETE /api/Detallepedido/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el detalle de pedido" },
      { status: 500 }
    );
  }
}
