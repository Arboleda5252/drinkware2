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
      categoria: string;
      total_sold: number;
      last_sale: string | null;
      days_in_inventory: number;
      precio: number;
    }>(`
      SELECT
        p.idproducto,
        p.nombre,
        p.categoria,
        COALESCE(SUM(dp.cantidad), 0) as total_sold,
        MAX(ped.fecha_creacion) as last_sale,
        EXTRACT(DAY FROM (NOW() - MAX(ped.fecha_creacion)))::int as days_in_inventory,
        COALESCE(p.precio, 0) as precio
      FROM public.producto p
      LEFT JOIN public.detalle_pedido dp ON p.idproducto = dp.id_producto
      LEFT JOIN public.pedido ped ON dp.id_pedido = ped.id_pedido
      WHERE p.estados = 'Disponible'
      GROUP BY p.idproducto, p.nombre, p.categoria, p.precio
      HAVING COALESCE(SUM(dp.cantidad), 0) < 5
        OR (MAX(dp.fechapago) IS NULL)
        OR EXTRACT(DAY FROM (NOW() - MAX(dp.fechapago))) > 30
      ORDER BY total_sold ASC, days_in_inventory DESC
      LIMIT 15
    `);

    return products.map(p => ({
      id: p.idproducto,
      name: p.nombre,
      category: p.categoria || 'Sin categoría',
      totalSold: Number(p.total_sold),
      lastSaleDate: p.last_sale,
      daysInInventory: p.days_in_inventory || 0,
      price: Number(p.precio),
    }));
  } catch (error) {
    console.error("Error obteniendo productos de baja rotación:", error);
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
        <h2 className="text-2xl font-bold text-white">Productos de Baja Rotación</h2>
        <p className="mt-2 text-sm text-slate-400">Identifica productos lentamente que necesitan atención</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/80">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-700/50 bg-slate-950/90 px-5 py-4 text-sm uppercase tracking-[0.18em] text-slate-400">
          <span className="col-span-2">Producto</span>
          <span>Categoría</span>
          <span>Vendidas</span>
          <span>Última venta</span>
          <span className="text-right">Precio</span>
        </div>

        <div className="divide-y divide-slate-800">
          {products.map((product) => {
            const daysSinceLastSale = product.daysInInventory;
            const isAlert = daysSinceLastSale > 60 || product.totalSold === 0;

            return (
              <div key={product.id} className={`grid grid-cols-6 gap-4 px-5 py-4 text-sm ${isAlert ? 'bg-red-950/20' : ''}`}>
                <span className="col-span-2 truncate text-slate-200 font-medium">{product.name}</span>
                <span className="text-slate-400">{product.category}</span>
                <span className="text-slate-300">
                  {product.totalSold}
                  <span className="text-xs text-slate-500 ml-1">unid.</span>
                </span>
                <span className={`text-sm ${isAlert ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                  {product.lastSaleDate ? (
                    <>
                      hace {daysSinceLastSale}d
                    </>
                  ) : (
                    'Nunca'
                  )}
                </span>
                <span className="text-right text-slate-300">${product.price.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4">
        <p className="text-sm text-amber-200">
          <strong>💡 Recomendación:</strong> Considera hacer promociones en estos productos, revisar su ubicación en tienda o evaluar si es necesario descontinuarlos.
        </p>
      </div>
    </section>
  );
}

