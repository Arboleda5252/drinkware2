import { sql } from "@/app/Datalibs/database";

interface LowRotationProduct {
  id: number;
  name: string;
  category: string;
  totalSold: number;
  lastSaleDate: string | null;
  daysInInventory: number;
  price: number;
}

async function getLowRotationProducts(): Promise<LowRotationProduct[]> {
  try {
    const { rows: products } = await sql<{
      idproducto: number;
      nombre: string;
      categoria: string | null;
      total_sold: number;
      last_sale: string | null;
      days_in_inventory: number;
      precio: number;
    }>(`
      SELECT
        p.idproducto,
        p.nombre,
        p.categoria,
        COALESCE(SUM(dp.cantidad) FILTER (WHERE LOWER(pg.estado_pago) = 'pagado'), 0)::double precision AS total_sold,
        MAX(pg.fecha_pago) FILTER (WHERE LOWER(pg.estado_pago) = 'pagado')::text AS last_sale,
        COALESCE(
          EXTRACT(DAY FROM (NOW() - MAX(pg.fecha_pago) FILTER (WHERE LOWER(pg.estado_pago) = 'pagado')))::int,
          999
        ) AS days_in_inventory,
        COALESCE(p.precio_cliente, p.precio, 0)::double precision AS precio
      FROM public.producto p
      LEFT JOIN public.detalle_pedido dp ON p.idproducto = dp.id_producto
      LEFT JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      LEFT JOIN public.pago pg ON pg.id_pedido = ped.id_pedido
      WHERE p.estados = 'Disponible'
      GROUP BY p.idproducto, p.nombre, p.categoria, p.precio, p.precio_cliente
      HAVING COALESCE(SUM(dp.cantidad) FILTER (WHERE LOWER(pg.estado_pago) = 'pagado'), 0) < 5
        OR MAX(pg.fecha_pago) FILTER (WHERE LOWER(pg.estado_pago) = 'pagado') IS NULL
        OR EXTRACT(DAY FROM (NOW() - MAX(pg.fecha_pago) FILTER (WHERE LOWER(pg.estado_pago) = 'pagado'))) > 30
      ORDER BY total_sold ASC, days_in_inventory DESC
      LIMIT 15
    `);

    return products.map((product) => ({
      id: product.idproducto,
      name: product.nombre,
      category: product.categoria || "Sin categoria",
      totalSold: Number(product.total_sold),
      lastSaleDate: product.last_sale,
      daysInInventory: Number(product.days_in_inventory) || 0,
      price: Number(product.precio),
    }));
  } catch (error) {
    console.error("Error obteniendo productos de baja rotacion:", error);
    return [];
  }
}

export default async function LowRotationProducts() {
  const products = await getLowRotationProducts();

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Productos de Baja Rotacion</h2>
        <p className="mt-2 text-sm text-slate-400">Identifica productos lentamente que necesitan atencion</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/80">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-700/50 bg-slate-950/90 px-5 py-4 text-sm uppercase tracking-[0.18em] text-slate-400">
          <span className="col-span-2">Producto</span>
          <span>Categoria</span>
          <span>Vendidas</span>
          <span>Ultima venta</span>
          <span className="text-right">Precio</span>
        </div>

        <div className="divide-y divide-slate-800">
          {products.map((product) => {
            const daysSinceLastSale = product.daysInInventory;
            const isAlert = daysSinceLastSale > 60 || product.totalSold === 0;

            return (
              <div key={product.id} className={`grid grid-cols-6 gap-4 px-5 py-4 text-sm ${isAlert ? "bg-red-950/20" : ""}`}>
                <span className="col-span-2 truncate font-medium text-slate-200">{product.name}</span>
                <span className="text-slate-400">{product.category}</span>
                <span className="text-slate-300">
                  {product.totalSold}
                  <span className="ml-1 text-xs text-slate-500">unid.</span>
                </span>
                <span className={`text-sm ${isAlert ? "font-semibold text-red-400" : "text-slate-400"}`}>
                  {product.lastSaleDate ? <>hace {daysSinceLastSale}d</> : "Nunca"}
                </span>
                <span className="text-right text-slate-300">${product.price.toLocaleString("es-CO")}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4">
        <p className="text-sm text-amber-200">
          <strong>Recomendacion:</strong> Considera hacer promociones en estos productos, revisar su ubicacion en tienda o evaluar si es necesario descontinuarlos.
        </p>
      </div>
    </section>
  );
}
