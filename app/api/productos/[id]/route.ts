import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';

export const runtime = 'nodejs';

type ProductoDetalle = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  descripcion: string | null;
  id_proveedor: number | null;
  pedidos: boolean;
  estados: string | null;
};

// GET
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rows } = await sql<ProductoDetalle>(`
      SELECT
        p.idproducto AS id,
        p.nombre,
        p.categoria,
        p.precio::double precision AS precio,
        p.stock::int AS stock,
        p.imagen,
        p.descripcion,
        p.id_proveedor,
        EXISTS (
          SELECT 1
          FROM public.pedidosproveedor AS pp
          WHERE pp.producto_id = p.idproducto
            AND pp.estado = 'Pendiente'
        ) AS pedidos,
        p.estados
      FROM public.producto AS p
      WHERE p.idproducto = $1
      LIMIT 1;
    `, [Number(params.id)]);

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener el producto' },
      { status: 500 }
    );
  }
}

// POST
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
    }

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const accion =
      typeof body?.accion === "string" ? body.accion.toLowerCase() : "inactivar";

    let productoExisteCache: boolean | null = null;
    const asegurarProductoExiste = async () => {
      if (productoExisteCache !== null) {
        return productoExisteCache;
      }
      const { rows } = await sql<{ existe: boolean }>(`
        SELECT EXISTS(
          SELECT 1
          FROM public.producto
          WHERE idproducto = $1
        ) AS existe;
      `, [id]);
      productoExisteCache = Boolean(rows[0]?.existe);
      return productoExisteCache;
    };

    if (accion === "ajustar_stock") {
      const cantidad = Number(body?.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          { ok: false, error: "La cantidad debe ser un entero positivo" },
          { status: 400 }
        );
      }

      const operacion =
        typeof body?.operacion === "string" ? body.operacion.toLowerCase() : "disminuir";
      const factor = operacion === "incrementar" ? 1 : operacion === "disminuir" ? -1 : null;
      if (factor === null) {
        return NextResponse.json(
          { ok: false, error: "Operacion invalida. Use 'incrementar' o 'disminuir'" },
          { status: 400 }
        );
      }

      const delta = factor * cantidad;
      const { rows } = await sql<{ stock: number }>(
        `
          UPDATE public.producto
          SET stock = stock + $2
          WHERE idproducto = $1
            AND (stock + $2) >= 0
          RETURNING stock::int AS stock;
        `,
        [id, delta]
      );

      if (!rows[0]) {
        if (!(await asegurarProductoExiste())) {
          return NextResponse.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
        }
        return NextResponse.json(
          { ok: false, error: "Stock insuficiente para realizar el ajuste" },
          { status: 409 }
        );
      }

      return NextResponse.json({ ok: true, data: { stock: rows[0].stock } });
    }

    if (accion === "solicitar_pedido") {
      const cantidad = Number(body?.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          { ok: false, error: "La cantidad debe ser un entero mayor a cero" },
          { status: 400 }
        );
      }

      const descripcion =
        body?.descripcion === null
          ? null
          : typeof body?.descripcion === "string"
          ? body.descripcion.trim() || null
          : null;

      if (!(await asegurarProductoExiste())) {
        return NextResponse.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
      }

      const { rows: pendientes } = await sql<{ existe: boolean }>(`
        SELECT EXISTS(
          SELECT 1
          FROM public.pedidosproveedor AS pp
          WHERE pp.producto_id = $1
            AND pp.estado = 'Pendiente'
        ) AS existe;
      `, [id]);

      if (pendientes[0]?.existe) {
        return NextResponse.json(
          { ok: false, error: "Ya existe una solicitud pendiente para este producto" },
          { status: 409 }
        );
      }

      const { rows } = await sql<{
        id: number;
        producto_id: number;
        cantidad: number;
        estado: string;
        descripcion: string | null;
        creado_en: string;
      }>(`
        INSERT INTO public.pedidosproveedor (producto_id, cantidad, descripcion)
        VALUES ($1, $2, $3)
        RETURNING id, producto_id, cantidad, estado, descripcion, creado_en;
      `, [id, cantidad, descripcion]);

      return NextResponse.json({ ok: true, data: rows[0] }, { status: 201 });
    }

    if (accion === "limpiar_pedido") {
      if (!(await asegurarProductoExiste())) {
        return NextResponse.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
      }

      const { rows } = await sql<{ id: number }>(`
        DELETE FROM public.pedidosproveedor
        WHERE producto_id = $1
          AND estado = 'Pendiente'
        RETURNING id;
      `, [id]);

      return NextResponse.json({ ok: true, data: { eliminados: rows.length } });
    }

    const estadoPorAccion: Record<string, string> = {
      inactivar: "Inactivo",
      activar: "Disponible",
    };

    const nuevoEstado = estadoPorAccion[accion];
    if (!nuevoEstado) {
      return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
    }

    const { rows } = await sql<{ id: number; estados: string }>(`
      UPDATE public.producto
      SET estados = $2
      WHERE idproducto = $1
      RETURNING idproducto AS id, estados;
    `, [id, nuevoEstado]);

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Error al descontinuar producto" }, { status: 500 });
  }
}

// PUT
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Cuerpo de la solicitud inválido' },
        { status: 400 }
      );
    }
    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
    const categoria =
      body?.categoria === null
        ? null
        : typeof body?.categoria === 'string'
        ? body.categoria.trim() || null
        : null;
    const precio = Number(body?.precio);
    const stock = Number(body?.stock);
    const imagen =
      body?.imagen === null
        ? null
        : typeof body?.imagen === 'string'
        ? body.imagen.trim() || null
        : null;
    const descripcion =
      body?.descripcion === null
        ? null
        : typeof body?.descripcion === 'string'
        ? body.descripcion.trim() || null
        : null;
    const idProveedor =
      body?.id_proveedor === null || body?.id_proveedor === undefined
        ? null
        : Number(body.id_proveedor);
    const estados =
      body?.estados === undefined
        ? null
        : body?.estados === null
        ? null
        : typeof body.estados === 'string'
        ? body.estados.trim() || null
        : null;

    if (!nombre) {
      return NextResponse.json(
        { ok: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json(
        { ok: false, error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { ok: false, error: 'El stock debe ser un número entero válido' },
        { status: 400 }
      );
    }

    if (
      idProveedor !== null &&
      (!Number.isInteger(idProveedor) || idProveedor <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: 'El proveedor debe ser un número entero válido' },
        { status: 400 }
      );
    }

    const { rows } = await sql<ProductoDetalle>(`
      UPDATE public.producto
      SET
        nombre = $2,
        categoria = $3,
        precio = $4,
        stock = $5,
        imagen = $6,
        descripcion = $7,
        id_proveedor = $8,
        estados = COALESCE($9, estados)
      WHERE idproducto = $1
      RETURNING
        idproducto AS id,
        nombre,
        categoria,
        precio::double precision AS precio,
        stock::int AS stock,
        imagen,
        descripcion,
        id_proveedor,
        EXISTS (
          SELECT 1
          FROM public.pedidosproveedor AS pp
          WHERE pp.producto_id = public.producto.idproducto
            AND pp.estado = 'Pendiente'
        ) AS pedidos,
        estados;
    `, [
      id,
      nombre,
      categoria,
      precio,
      stock,
      imagen,
      descripcion,
      idProveedor,
      estados,
    ]);

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar el producto' },
      { status: 500 }
    );
  }
}