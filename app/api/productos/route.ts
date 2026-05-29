import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';
import { logStockMovement } from '@/app/Datalibs/inventoryMovements';

export const runtime = 'nodejs';

type ProductoListado = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  precio_base: number;
  stock: number;
  imagen: string | null;
  descripcion: string | null;
  id_proveedor: number | null;
  pedidos: boolean;
  estados: string | null;
  iva_porcentaje: number;
  subida_porcentaje: number;
  precio_cliente: number;
  unidades_vendidas: number;
  ventas_total: number;
  dias_sin_movimiento: number;
  valor_inventario: number;
  estado_stock: string;
  rotacion: string;
};

// GET
export async function GET() {
  try {
    const { rows } = await sql<ProductoListado>(`
      WITH ventas AS (
        SELECT
          id_producto,
          SUM(cantidad)::double precision AS unidades_vendidas,
          SUM(subtotal)::double precision AS ventas_total,
          MAX(fechapago) AS ultima_venta
        FROM public.detallepedido
        GROUP BY id_producto
      )
      SELECT
        p.idproducto AS id,
        p.nombre,
        p.categoria,
        p.precio_cliente::double precision AS precio,
        p.precio::double precision AS precio_base,
        p.stock::int AS stock,
        p.imagen,
        p.descripcion,
        p.id_proveedor,
        p.iva_porcentaje::double precision AS iva_porcentaje,
        p.subida_porcentaje::double precision AS subida_porcentaje,
        EXISTS (
          SELECT 1
          FROM public.pedidosproveedor AS pp
          WHERE pp.producto_id = p.idproducto
            AND pp.estado = 'Pendiente'
        ) AS pedidos,
        p.estados,
        p.precio_cliente::double precision AS precio_cliente,
        COALESCE(v.unidades_vendidas, 0)::double precision AS unidades_vendidas,
        COALESCE(v.ventas_total, 0)::double precision AS ventas_total,
        COALESCE(
          FLOOR(EXTRACT(EPOCH FROM (NOW() - v.ultima_venta)) / 86400),
          999
        )::int AS dias_sin_movimiento,
        (p.stock * p.precio_cliente)::double precision AS valor_inventario,
        CASE
          WHEN p.stock <= 5 THEN 'critico'
          WHEN p.stock <= 20 THEN 'alerta'
          WHEN p.stock >= 100 THEN 'sobrestock'
          ELSE 'saludable'
        END AS estado_stock,
        CASE
          WHEN COALESCE(v.unidades_vendidas, 0) >= 50 THEN 'alta'
          WHEN COALESCE(v.unidades_vendidas, 0) >= 10 THEN 'media'
          ELSE 'baja'
        END AS rotacion
      FROM public.producto AS p
      LEFT JOIN ventas AS v ON v.id_producto = p.idproducto
      ORDER BY p.nombre;
    `);

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al listar productos' },
      { status: 500 }
    );
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
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
      typeof body?.estados === 'string' && body.estados.trim()
        ? body.estados.trim()
        : 'Disponible';

    const iva_porcentaje = Number(body?.iva_porcentaje ?? 0);
    const subida_porcentaje = Number(body?.subida_porcentaje ?? 0);

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

    if (!Number.isFinite(iva_porcentaje) || iva_porcentaje < 0) {
      return NextResponse.json(
        { ok: false, error: 'El iva_porcentaje debe ser un número válido' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subida_porcentaje) || subida_porcentaje < 0) {
      return NextResponse.json(
        { ok: false, error: 'La subida_porcentaje debe ser un número válido' },
        { status: 400 }
      );
    }

    const { rows } = await sql<ProductoListado>(`
      INSERT INTO public.producto
        (nombre, categoria, precio, stock, imagen, descripcion, id_proveedor, estados, iva_porcentaje, subida_porcentaje)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        idproducto AS id,
        nombre,
        categoria,
        precio_cliente::double precision AS precio,
        precio::double precision AS precio_base,
        stock::int AS stock,
        imagen,
        descripcion,
        id_proveedor,
        FALSE AS pedidos,
        estados,
        iva_porcentaje::double precision AS iva_porcentaje,
        subida_porcentaje::double precision AS subida_porcentaje,
        precio_cliente::double precision AS precio_cliente;
    `, [
      nombre,
      categoria,
      precio,
      stock,
      imagen,
      descripcion,
      idProveedor,
      estados,
      iva_porcentaje,
      subida_porcentaje,
    ]);

    if (rows[0]?.stock > 0) {
      await logStockMovement({
        productoId: rows[0].id,
        stockAnterior: 0,
        stockNuevo: rows[0].stock,
        referencia: "Creacion de producto",
      });
    }

    return NextResponse.json({ ok: true, data: rows[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al crear el producto' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    const accion = typeof body?.accion === "string" ? body.accion.toLowerCase() : "";
    if (accion !== "actualizar_suba_categoria") {
      return NextResponse.json({ ok: false, error: "Accion invalida" }, { status: 400 });
    }

    const categoria =
      typeof body?.categoria === "string" && body.categoria.trim().length > 0
        ? body.categoria.trim()
        : null;
    const subidaPorcentaje = Number(body?.subida_porcentaje ?? body?.suba);

    if (!categoria) {
      return NextResponse.json(
        { ok: false, error: "La categoria es obligatoria" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subidaPorcentaje) || subidaPorcentaje < 0) {
      return NextResponse.json(
        { ok: false, error: "La SUBA debe ser un numero valido" },
        { status: 400 }
      );
    }

    const { rows } = await sql<ProductoListado>(
      `
        UPDATE public.producto
        SET subida_porcentaje = $2
        WHERE categoria = $1
        RETURNING
          idproducto AS id,
          nombre,
          categoria,
          precio_cliente::double precision AS precio,
          precio::double precision AS precio_base,
          stock::int AS stock,
          imagen,
          descripcion,
          id_proveedor,
          iva_porcentaje::double precision AS iva_porcentaje,
          subida_porcentaje::double precision AS subida_porcentaje,
          EXISTS (
            SELECT 1
            FROM public.pedidosproveedor AS pp
            WHERE pp.producto_id = public.producto.idproducto
              AND pp.estado = 'Pendiente'
          ) AS pedidos,
          estados,
          precio_cliente::double precision AS precio_cliente
        ;
      `,
      [categoria, subidaPorcentaje]
    );

    return NextResponse.json({ ok: true, data: rows, updated: rows.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar la SUBA por categoria' },
      { status: 500 }
    );
  }
}
