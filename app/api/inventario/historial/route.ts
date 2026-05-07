import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';

export const runtime = 'nodejs';

interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto_nombre: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  responsable: string | null;
  referencia: string | null;
  precio_unitario: number | null;
  subtotal: number | null;
}

interface HistorialResponse {
  movimientos: MovimientoInventario[];
  resumen: {
    totalEntradas: number;
    totalSalidas: number;
    saldo: number;
    periodo: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    const dias = req.nextUrl.searchParams.get('dias') || '30';
    const diasNum = Math.max(1, parseInt(dias));

    let movimientos: MovimientoInventario[] = [];

    // Salidas: Detalles de pedidos
    const { rows: salidas } = await sql<any>(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY p.fecha_creacion DESC) as id,
        dp.id_producto AS producto_id,
        pr.nombre AS producto_nombre,
        'salida'::text AS tipo,
        dp.cantidad,
        p.fecha_creacion::text AS fecha,
        u.nombre AS responsable,
        CONCAT('Pedido #', p.id_pedido) AS referencia,
        dp.precio_unitario AS precio_unitario,
        dp.subtotal
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      JOIN public.producto pr ON dp.id_producto = pr.idproducto
      LEFT JOIN public.usuario u ON p.id_vendedor = u.idusuario
      WHERE p.fecha_creacion >= NOW() - INTERVAL '1 day' * $1
        ${productId ? 'AND dp.id_producto = $2' : ''}
      ORDER BY p.fecha_creacion DESC
      LIMIT 100
    `, productId ? [diasNum, productId] : [diasNum]);

    // Entradas: Pedidos a proveedores aceptados
    const { rows: entradas } = await sql<any>(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY pp.creado_en DESC) as id,
        pp.producto_id,
        pr.nombre AS producto_nombre,
        'entrada'::text AS tipo,
        pp.cantidad,
        pp.creado_en::text AS fecha,
        NULL::text AS responsable,
        CONCAT('Compra Proveedor #', pp.id) AS referencia,
        pr.precio AS precio_unitario,
        (pp.cantidad * pr.precio) AS subtotal
      FROM public.pedidosproveedor pp
      JOIN public.producto pr ON pp.producto_id = pr.idproducto
      WHERE pp.estado = 'Aceptado' 
        AND pp.creado_en >= NOW() - INTERVAL '1 day' * $1
        ${productId ? 'AND pp.producto_id = $2' : ''}
      ORDER BY pp.creado_en DESC
      LIMIT 100
    `, productId ? [diasNum, productId] : [diasNum]);

    // Combinar y ordenar
    const todosMovimientos = [...salidas, ...entradas]
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .map((m: any, idx: number) => ({
        id: idx + 1,
        producto_id: m.producto_id,
        producto_nombre: m.producto_nombre,
        tipo: m.tipo,
        cantidad: m.cantidad,
        fecha: m.fecha,
        responsable: m.responsable,
        referencia: m.referencia,
        precio_unitario: m.precio_unitario,
        subtotal: m.subtotal
      }));

    // Resumen
    const totalEntradas = todosMovimientos
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.cantidad, 0);

    const totalSalidas = todosMovimientos
      .filter(m => m.tipo === 'salida')
      .reduce((sum, m) => sum + m.cantidad, 0);

    const response: HistorialResponse = {
      movimientos: todosMovimientos,
      resumen: {
        totalEntradas,
        totalSalidas,
        saldo: totalEntradas - totalSalidas,
        periodo: `Últimos ${diasNum} días`
      }
    };

    return NextResponse.json({ ok: true, data: response });
  } catch (error) {
    console.error('[API inventario/historial]', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener historial de movimientos' },
      { status: 500 }
    );
  }
}
