import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';
import { logStockMovement } from '@/app/Datalibs/inventoryMovements';

export const runtime = 'nodejs';

type PedidoProveedor = {
  id: number;
  producto_id: number;
  cantidad: number;
  estado: string;
  descripcion: string | null;
  creado_en: string;
};

export async function GET() {
  try {
    const { rows } = await sql<PedidoProveedor>(`
      SELECT
        id,
        producto_id,
        cantidad,
        estado::text AS estado,
        descripcion,
        creado_en
      FROM public.pedidosproveedor
      ORDER BY creado_en DESC;
    `);

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al listar pedidos de proveedor' },
      { status: 500 }
    );
  }
}

const normalizarDescripcion = (valor: unknown) => {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  return texto || null;
};

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Cuerpo de la solicitud inválido' },
        { status: 400 }
      );
    }

    const accion =
      typeof body?.accion === 'string' ? body.accion.toLowerCase() : '';
    const pedidoId = Number(body?.pedido_id);
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return NextResponse.json(
        { ok: false, error: 'El pedido es inválido' },
        { status: 400 }
      );
    }

    const descripcion = normalizarDescripcion(body?.descripcion);

    if (accion === 'aceptar') {
      const { rows } = await sql<
        PedidoProveedor & { nuevo_stock: number }
      >(
        `
        WITH pedido AS (
          SELECT id, producto_id, cantidad
          FROM public.pedidosproveedor
          WHERE id = $1 AND estado = 'Pendiente'
        ),
        update_producto AS (
          UPDATE public.producto AS pr
          SET stock = pr.stock + pedido.cantidad
          FROM pedido
          WHERE pr.idproducto = pedido.producto_id
          RETURNING pr.idproducto, pr.stock
        ),
        update_pedido AS (
          UPDATE public.pedidosproveedor AS pp
          SET estado = 'Aceptado',
              descripcion = COALESCE($2, pp.descripcion)
          FROM pedido
          WHERE pp.id = pedido.id
          RETURNING pp.id,
                   pp.producto_id,
                   pp.cantidad,
                   pp.estado::text AS estado,
                   pp.descripcion,
                   pp.creado_en
        )
        SELECT
          update_pedido.*,
          update_producto.stock AS nuevo_stock
        FROM update_pedido
        JOIN update_producto ON true;
      `,
        [pedidoId, descripcion]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Pedido no encontrado o ya procesado' },
          { status: 404 }
        );
      }

      await logStockMovement({
        productoId: rows[0].producto_id,
        stockAnterior: rows[0].nuevo_stock - rows[0].cantidad,
        stockNuevo: rows[0].nuevo_stock,
        referencia: `Pedido proveedor #${rows[0].id}`,
      });

      return NextResponse.json({
        ok: true,
        data: {
          pedido: rows[0],
          producto: { id: rows[0].producto_id, stock: rows[0].nuevo_stock },
        },
      });
    }

    if (accion === 'rechazar') {
      const { rows } = await sql<PedidoProveedor>(
        `
        UPDATE public.pedidosproveedor
        SET estado = 'Rechazado',
            descripcion = COALESCE($2, descripcion)
        WHERE id = $1
          AND estado = 'Pendiente'
        RETURNING id,
                  producto_id,
                  cantidad,
                  estado::text AS estado,
                  descripcion,
                  creado_en;
      `,
        [pedidoId, descripcion]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Pedido no encontrado o ya procesado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: { pedido: rows[0] },
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Acción inválida' },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar el pedido' },
      { status: 500 }
    );
  }
}
