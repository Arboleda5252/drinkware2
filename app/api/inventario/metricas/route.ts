import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/Datalibs/database';

export const runtime = 'nodejs';

interface ProductMetrics {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  descripcion: string | null;
  estado: string | null;
  
  // Metricas calculadas
  unidadesVendidas: number;
  ventasTotal: number;
  diasSinMovimiento: number;
  rotacionAnual: number;
  diasPromedioPermanencia: number;
  valorInventario: number;
  estado_stock: 'saludable' | 'alerta' | 'critico' | 'sobrestock';
  
  // Clasificacion
  rotacion: 'alta' | 'media' | 'baja';
  estrategia: 'estrella' | 'oportunidad' | 'atencion' | 'parado';
}

interface KPISummary {
  valorTotalInventario: number;
  totalProductos: number;
  productosActivos: number;
  productosBajoStock: number;
  productosSinRotacion: number;
  productosProxAgotarse: number;
  margenPromedio: number;
  rotacionPromedio: number;
  capitalInmovilizado: number;
}

interface InventarioResponse {
  kpis: KPISummary;
  productos: ProductMetrics[];
  estadoInventario: {
    saludable: number;
    alerta: number;
    critico: number;
    sobrestock: number;
  };
  movimientos: {
    entradas: number;
    salidas: number;
    saldo: number;
  };
  productosPorCategoria: Array<{
    categoria: string;
    cantidad: number;
    valor: number;
    rotacion: number;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const dias = req.nextUrl.searchParams.get('dias') || '30';
    const diasNum = Math.max(1, parseInt(dias));

    // 1. Traer todos los productos
    const { rows: productos } = await sql<any>(`
      SELECT
        p.idproducto AS id,
        p.nombre,
        p.categoria,
        p.precio::numeric AS precio,
        p.stock::int AS stock,
        p.imagen,
        p.descripcion,
        p.estados
      FROM public.producto AS p
      WHERE p.estados IS NULL OR p.estados != 'Inactivo'
      ORDER BY p.nombre
    `);

    // 2. Obtener datos de ventas para calcular rotacion
    const { rows: ventasData } = await sql<any>(`
      SELECT
        dp.id_producto,
        COUNT(*) AS cantidad_transacciones,
        SUM(dp.cantidad) AS total_cantidad,
        MAX(p.fecha_creacion) AS ultima_venta,
        SUM(dp.subtotal) AS total_ventas
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      WHERE p.fecha_creacion >= NOW() - INTERVAL '1 year'
      GROUP BY dp.id_producto
    `);

    // 3. Obtener movimientos de stock (entradas via pedidosproveedor)
    const { rows: entradasData } = await sql<any>(`
      SELECT
        SUM(cantidad) AS total_entradas
      FROM public.pedidosproveedor
      WHERE estado = 'Aceptado' 
        AND creado_en >= NOW() - INTERVAL '1 day'
    `);

    // 4. Obtener salidas (detalle_pedido ultimo dia)
    const { rows: salidasData } = await sql<any>(`
      SELECT
        SUM(dp.cantidad) AS total_salidas
      FROM public.detalle_pedido dp
      JOIN public.pedido p ON dp.id_pedido = p.id_pedido
      WHERE p.fecha_creacion >= NOW() - INTERVAL '1 day'
    `);

    // Crear mapas para lookup rapido
    const ventasMap = new Map(ventasData.map((v: any) => [
      v.id_producto,
      {
        cantidad: v.total_cantidad || 0,
        ultima_venta: v.ultima_venta ? new Date(v.ultima_venta) : null,
        total_ventas: parseFloat(v.total_ventas || 0),
        transacciones: v.cantidad_transacciones || 0
      }
    ]));

    // Calcular metricas por producto
    const productosConMetricas: ProductMetrics[] = productos.map((prod: any) => {
      const ventas = ventasMap.get(prod.id);
      const precio = parseFloat(prod.precio);
      const stock = prod.stock;
      const valorInventario = precio * stock;
      
      // Calcular dias sin movimiento
      const ahora = new Date();
      const diasSinMovimiento = ventas?.ultima_venta
        ? Math.floor((ahora.getTime() - ventas.ultima_venta.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Si no hay ventas, asignar 999

      // Calcular rotacion anual
      const unidadesVendidas = ventas?.cantidad || 0;
      const rotacionAnual = unidadesVendidas;
      
      // Dias promedio de permanencia
      const diasPromedioPermanencia = unidadesVendidas > 0 
        ? Math.round(365 / (unidadesVendidas / 365))
        : 365;

      // Determinar estado del stock
      let estado_stock: 'saludable' | 'alerta' | 'critico' | 'sobrestock';
      const stockMinimo = Math.max(5, Math.ceil(unidadesVendidas / 12)); // stock minimo = consumo mensual
      const stockIdeal = Math.max(10, Math.ceil(unidadesVendidas / 6)); // stock ideal = consumo 2 meses

      if (stock === 0) {
        estado_stock = 'critico';
      } else if (stock <= stockMinimo) {
        estado_stock = 'critico';
      } else if (stock <= stockIdeal) {
        estado_stock = 'alerta';
      } else if (stock > stockIdeal * 3) {
        estado_stock = 'sobrestock';
      } else {
        estado_stock = 'saludable';
      }

      // Determinar clasificacion de rotacion y estrategia
      let rotacion: 'alta' | 'media' | 'baja';
      let estrategia: 'estrella' | 'oportunidad' | 'atencion' | 'parado';

      if (unidadesVendidas === 0) {
        rotacion = 'baja';
        estrategia = 'parado';
      } else if (diasSinMovimiento > 90) {
        rotacion = 'baja';
        estrategia = 'atencion';
      } else if (diasSinMovimiento > 30) {
        rotacion = 'media';
        estrategia = 'oportunidad';
      } else {
        rotacion = 'alta';
        estrategia = 'estrella';
      }

      return {
        id: prod.id,
        nombre: prod.nombre,
        categoria: prod.categoria,
        precio,
        stock,
        imagen: prod.imagen,
        descripcion: prod.descripcion,
        estado: prod.estados,
        unidadesVendidas,
        ventasTotal: ventas?.total_ventas || 0,
        diasSinMovimiento,
        rotacionAnual,
        diasPromedioPermanencia,
        valorInventario,
        estado_stock,
        rotacion,
        estrategia
      };
    });

    // Calcular KPIs globales
    const totalProductos = productosConMetricas.length;
    const productosActivos = productosConMetricas.filter(p => p.unidadesVendidas > 0).length;
    const productosBajoStock = productosConMetricas.filter(p => p.estado_stock === 'critico' || p.estado_stock === 'alerta').length;
    const productosSinRotacion = productosConMetricas.filter(p => p.diasSinMovimiento > 90).length;
    const productosProxAgotarse = productosConMetricas.filter(p => p.stock === 0 || (p.stock > 0 && p.stock <= 3)).length;

    const valorTotalInventario = productosConMetricas.reduce((sum, p) => sum + p.valorInventario, 0);
    const margenPromedio = productosConMetricas.length > 0
      ? Math.round(productosConMetricas.reduce((sum, p) => sum + p.precio, 0) / productosConMetricas.length)
      : 0;

    const rotacionPromedio = productosConMetricas.filter(p => p.unidadesVendidas > 0).length > 0
      ? Math.round(productosConMetricas
          .filter(p => p.unidadesVendidas > 0)
          .reduce((sum, p) => sum + p.rotacionAnual, 0) / productosConMetricas.filter(p => p.unidadesVendidas > 0).length)
      : 0;

    const capitalInmovilizado = productosConMetricas
      .filter(p => p.diasSinMovimiento > 60)
      .reduce((sum, p) => sum + p.valorInventario, 0);

    const kpis: KPISummary = {
      valorTotalInventario,
      totalProductos,
      productosActivos,
      productosBajoStock,
      productosSinRotacion,
      productosProxAgotarse,
      margenPromedio,
      rotacionPromedio,
      capitalInmovilizado
    };

    // Contar estados
    const estadoInventario = {
      saludable: productosConMetricas.filter(p => p.estado_stock === 'saludable').length,
      alerta: productosConMetricas.filter(p => p.estado_stock === 'alerta').length,
      critico: productosConMetricas.filter(p => p.estado_stock === 'critico').length,
      sobrestock: productosConMetricas.filter(p => p.estado_stock === 'sobrestock').length
    };

    // Movimientos dia
    const entradas = parseFloat(entradasData[0]?.total_entradas || 0);
    const salidas = parseFloat(salidasData[0]?.total_salidas || 0);

    // Por categoria
    const productosPorCategoria = Array.from(
      productosConMetricas.reduce((acc, prod) => {
        const cat = prod.categoria || 'Sin categoria';
        if (!acc.has(cat)) {
          acc.set(cat, { cantidad: 0, valor: 0, rotacion: 0, productos: 0 });
        }
        const existing = acc.get(cat)!;
        existing.cantidad += prod.stock;
        existing.valor += prod.valorInventario;
        existing.rotacion += prod.unidadesVendidas;
        existing.productos += 1;
        return acc;
      }, new Map<string, any>())
    ).map(([categoria, data]) => ({
      categoria,
      cantidad: data.cantidad,
      valor: data.valor,
      rotacion: Math.round(data.rotacion / data.productos)
    })).sort((a, b) => b.valor - a.valor);

    const response: InventarioResponse = {
      kpis,
      productos: productosConMetricas,
      estadoInventario,
      movimientos: {
        entradas,
        salidas,
        saldo: entradas - salidas
      },
      productosPorCategoria
    };

    return NextResponse.json({ ok: true, data: response });
  } catch (error) {
    console.error('[API inventario/metricas]', error);
    return NextResponse.json(
      { ok: false, error: 'Error al calcular métricas de inventario' },
      { status: 500 }
    );
  }
}
