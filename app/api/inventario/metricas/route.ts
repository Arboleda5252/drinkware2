import { NextResponse } from "next/server";
import { sql } from "@/app/Datalibs/database";
import { ensureInventoryMovementTable } from "@/app/Datalibs/inventoryMovements";

export const runtime = "nodejs";

type ProductoMetricasRow = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number | string | null;
  precioBase: number | string | null;
  ivaPorcentaje: number | string | null;
  subidaPorcentaje: number | string | null;
  stock: number | string | null;
  imagen: string | null;
  descripcion: string | null;
  estado: string | null;
  pedidos: boolean | null;
  unidadesVendidas: number | string | null;
  ventasTotal: number | string | null;
  ultimaVenta: string | null;
};

type MovimientosRow = {
  entradas: number | string | null;
  salidas: number | string | null;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDiasSinMovimiento(ultimaVenta: string | null) {
  if (!ultimaVenta) return 999;

  const parsed = new Date(ultimaVenta).getTime();
  if (Number.isNaN(parsed)) return 999;

  return Math.max(0, Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24)));
}

function getEstadoStock(stock: number) {
  if (stock <= 5) return "critico" as const;
  if (stock <= 20) return "alerta" as const;
  if (stock >= 100) return "sobrestock" as const;
  return "saludable" as const;
}

function getRotacion(unidadesVendidas: number) {
  if (unidadesVendidas >= 50) return "alta" as const;
  if (unidadesVendidas >= 10) return "media" as const;
  return "baja" as const;
}

function getEstrategia(
  rotacion: "alta" | "media" | "baja",
  estadoStock: "saludable" | "alerta" | "critico" | "sobrestock"
) {
  if (rotacion === "alta" && estadoStock !== "critico") return "estrella" as const;
  if (rotacion === "alta" || estadoStock === "alerta") return "oportunidad" as const;
  if (estadoStock === "critico" || estadoStock === "sobrestock") return "atencion" as const;
  return "parado" as const;
}

export async function GET() {
  try {
    await ensureInventoryMovementTable();

    const [{ rows: productosRows }, { rows: movimientosRows }] = await Promise.all([
      sql<ProductoMetricasRow>(`
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
          p.precio::double precision AS "precioBase",
          p.iva_porcentaje::double precision AS "ivaPorcentaje",
          p.subida_porcentaje::double precision AS "subidaPorcentaje",
          p.stock::int AS stock,
          p.imagen,
          p.descripcion,
          p.estados AS estado,
          EXISTS (
            SELECT 1
            FROM public.pedidosproveedor AS pp
            WHERE pp.producto_id = p.idproducto
              AND pp.estado = 'Pendiente'
          ) AS pedidos,
          COALESCE(v.unidades_vendidas, 0)::double precision AS "unidadesVendidas",
          COALESCE(v.ventas_total, 0)::double precision AS "ventasTotal",
          v.ultima_venta AS "ultimaVenta"
        FROM public.producto AS p
        LEFT JOIN ventas AS v ON v.id_producto = p.idproducto
        ORDER BY p.nombre;
      `),
      sql<MovimientosRow>(`
        SELECT
          COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'entrada'), 0)::double precision AS entradas,
          COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'salida'), 0)::double precision AS salidas
        FROM public.inventario_movimiento
        WHERE creado_en >= NOW() - INTERVAL '24 hours';
      `),
    ]);

    const productos = productosRows.map((row) => {
      const precio = toNumber(row.precio);
      const precioBase = toNumber(row.precioBase);
      const ivaPorcentaje = toNumber(row.ivaPorcentaje);
      const subidaPorcentaje = toNumber(row.subidaPorcentaje);
      const stock = toNumber(row.stock);
      const unidadesVendidas = toNumber(row.unidadesVendidas);
      const ventasTotal = toNumber(row.ventasTotal);
      const diasSinMovimiento = getDiasSinMovimiento(row.ultimaVenta);
      const valorInventario = stock * precio;
      const estadoStock = getEstadoStock(stock);
      const rotacion = getRotacion(unidadesVendidas);

      return {
        id: Number(row.id),
        nombre: row.nombre,
        categoria: row.categoria,
        precio,
        precio_base: precioBase,
        precio_cliente: precio,
        iva_porcentaje: ivaPorcentaje,
        subida_porcentaje: subidaPorcentaje,
        stock,
        imagen: row.imagen,
        descripcion: row.descripcion,
        estado: row.estado,
        pedidos: Boolean(row.pedidos),
        unidadesVendidas,
        ventasTotal,
        diasSinMovimiento,
        rotacionAnual: unidadesVendidas,
        diasPromedioPermanencia:
          unidadesVendidas > 0 ? Math.round((stock / unidadesVendidas) * 365) : 999,
        valorInventario,
        estado_stock: estadoStock,
        rotacion,
        estrategia: getEstrategia(rotacion, estadoStock),
        margenPorcentaje: precio > 0 ? ((precio - precioBase) / precio) * 100 : 0,
      };
    });

    const totalProductos = productos.length;
    const productosActivos = productos.filter(
      (producto) => producto.estado?.toLowerCase() !== "descontinuado"
    ).length;
    const valorTotalInventario = productos.reduce(
      (total, producto) => total + producto.valorInventario,
      0
    );
    const productosBajoStock = productos.filter(
      (producto) => producto.estado_stock === "critico" || producto.estado_stock === "alerta"
    ).length;
    const productosSinRotacion = productos.filter(
      (producto) => producto.diasSinMovimiento > 90
    ).length;
    const productosProxAgotarse = productos.filter(
      (producto) => producto.estado_stock === "critico"
    ).length;
    const capitalInmovilizado = productos
      .filter((producto) => producto.diasSinMovimiento > 60)
      .reduce((total, producto) => total + producto.valorInventario, 0);
    const margenPromedio =
      productos.length > 0
        ? productos.reduce((total, producto) => total + producto.margenPorcentaje, 0) /
          productos.length
        : 0;
    const rotacionPromedio =
      productos.length > 0
        ? productos.reduce((total, producto) => total + producto.rotacionAnual, 0) /
          productos.length
        : 0;

    const estadoInventario = productos.reduce(
      (acc, producto) => {
        acc[producto.estado_stock] += 1;
        return acc;
      },
      { saludable: 0, alerta: 0, critico: 0, sobrestock: 0 }
    );

    const categoriasMap = new Map<
      string,
      { categoria: string; cantidad: number; valor: number; rotacion: number }
    >();
    for (const producto of productos) {
      const categoria = producto.categoria ?? "Sin categoria";
      const current =
        categoriasMap.get(categoria) ?? { categoria, cantidad: 0, valor: 0, rotacion: 0 };

      current.cantidad += producto.stock;
      current.valor += producto.valorInventario;
      current.rotacion += producto.rotacionAnual;
      categoriasMap.set(categoria, current);
    }

    const movimientos = {
      entradas: toNumber(movimientosRows[0]?.entradas),
      salidas: toNumber(movimientosRows[0]?.salidas),
      saldo: toNumber(movimientosRows[0]?.entradas) - toNumber(movimientosRows[0]?.salidas),
    };

    return NextResponse.json({
      ok: true,
      data: {
        kpis: {
          valorTotalInventario,
          totalProductos,
          productosActivos,
          productosBajoStock,
          productosSinRotacion,
          productosProxAgotarse,
          margenPromedio,
          rotacionPromedio,
          capitalInmovilizado,
        },
        productos,
        estadoInventario,
        movimientos,
        productosPorCategoria: Array.from(categoriasMap.values()),
      },
    });
  } catch (error) {
    console.error("[GET /api/inventario/metricas]", error);
    return NextResponse.json(
      { ok: false, error: "Error al calcular metricas de inventario" },
      { status: 500 }
    );
  }
}
