import Link from "next/link";
import { sql } from "@/app/Datalibs/database";
import ProductReportShell, { ProductDetail } from "./product-report-shell";

const stats = {
  totalProducts: 84,
  totalSales: 23560,
  averageTicket: 125,
};

const productDetails: ProductDetail[] = [
  {
    id: 1,
    name: "Fernet Premium",
    category: "Licores",
    price: 52000,
    cost: 31000,
    margin: 40,
    sold: 760,
    revenue: 3940000,
    share: 10,
    avgTicket: 39000,
    inventoryDays: 28,
    stock: 18,
    velocity: "Media",
    rotation: "Media rotación",
    trend: "Estable",
    trendText: "Buen desempeño, pero puede crecer con mejor impulso comercial.",
    marginPerUnit: 21000,
    profit: 15960000,
    related: ["Whisky Reserva + Soda", "Cerveza Artesanal + Snacks"],
    buyerProfiles: ["VIP", "Frecuentes"],
    recommendation: "Aumenta promoción en semana para mejorar ticket promedio sin sacrificar margen.",
    strategic: "Amarillo",
    classification: "Vende bien, pero aún puede mejorar su rotación y margen.",
    image: "copa.png",
  },
  {
    id: 2,
    name: "Cerveza Artesanal",
    category: "Cervezas",
    price: 12000,
    cost: 6200,
    margin: 48,
    sold: 1120,
    revenue: 1344000,
    share: 19,
    avgTicket: 12000,
    inventoryDays: 12,
    stock: 42,
    velocity: "Alta",
    rotation: "Alta rotación",
    trend: "Creciente",
    trendText: "Alto volumen con buena continuidad. Ideal para combos de impulso.",
    marginPerUnit: 5800,
    profit: 6496000,
    related: ["Snacks salados", "Soda Lime"],
    buyerProfiles: ["Frecuentes", "Nuevos clientes"],
    recommendation: "Impulsa combos de cervezas con snacks para captar clientes de alto volumen.",
    strategic: "Verde",
    classification: "Producto estrella: vende mucho y deja margen saludable.",
    image: "cervezas.png",
  },
  {
    id: 3,
    name: "Sirope de Anís",
    category: "Mixers",
    price: 8500,
    cost: 3200,
    margin: 62,
    sold: 940,
    revenue: 799000,
    share: 13,
    avgTicket: 8500,
    inventoryDays: 45,
    stock: 75,
    velocity: "Baja",
    rotation: "Baja rotación",
    trend: "En caída",
    trendText: "Tiene buen margen, pero necesita mayor rotación y promoción cruzada.",
    marginPerUnit: 5300,
    profit: 4982000,
    related: ["Whisky Reserva + Sirope", "Vodka Premium + Mixer"],
    buyerProfiles: ["VIP", "Frecuentes"],
    recommendation: "Crea una promoción cruzada con licores para mover stock lento.",
    strategic: "Rojo",
    classification: "Producto con buen margen, pero rotación baja. Precisa estrategia de impulso.",
    image: "descorchar.jpg",
  },
  {
    id: 4,
    name: "Whisky Reserva",
    category: "Licores",
    price: 85000,
    cost: 52000,
    margin: 39,
    sold: 420,
    revenue: 3570000,
    share: 16,
    avgTicket: 85000,
    inventoryDays: 35,
    stock: 12,
    velocity: "Media",
    rotation: "Media rotación",
    trend: "Creciente",
    trendText: "Alta demanda premium, pero el stock requiere monitoreo.",
    marginPerUnit: 33000,
    profit: 13860000,
    related: ["Sirope de Anís", "Hielo Premium"],
    buyerProfiles: ["VIP", "Nuevos clientes"],
    recommendation: "Mantén disponibilidad y evalúa aumentar precio moderado según demanda.",
    strategic: "Amarillo",
    classification: "Producto con buena rentabilidad, ideal para promociones premium.",
    image: "rones.png",
  },
  {
    id: 5,
    name: "Vodka Premium",
    category: "Licores",
    price: 48000,
    cost: 25000,
    margin: 48,
    sold: 620,
    revenue: 2976000,
    share: 14,
    avgTicket: 48000,
    inventoryDays: 20,
    stock: 28,
    velocity: "Alta",
    rotation: "Alta rotación",
    trend: "Creciente",
    trendText: "Buen desempeño con margen sólido, apto para ventas frecuentes.",
    marginPerUnit: 23000,
    profit: 14260000,
    related: ["Mixer Citrus", "Hielo"],
    buyerProfiles: ["Frecuentes", "VIP"],
    recommendation: "Impulsa combos de vodka con mixers y hielo para aumentar ticket medio.",
    strategic: "Verde",
    classification: "Producto con alto rendimiento y buen retorno por unidad.",
    image: "club.jpg",
  },
];

async function getProductStats() {
  try {
    // Total productos
    const { rows: productCount } = await sql<{ count: number }>(
      "SELECT COUNT(*) as count FROM public.producto WHERE estados = 'Disponible'"
    );

    // Ventas totales e ingresos
    const { rows: salesData } = await sql<{ total_sales: number; total_revenue: number }>(`
      SELECT
        COALESCE(SUM(dp.cantidad), 0) as total_sales,
        COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.detalle_pedido dp
    `);

    const totalProducts = productCount[0]?.count || 0;
    const totalSales = salesData[0]?.total_sales || 0;
    const totalRevenue = salesData[0]?.total_revenue || 0;
    const averageTicket = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    return {
      totalProducts,
      totalSales,
      averageTicket,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de productos:", error);
    return stats;
  }
}

async function getTopProducts() {
  try {
    const { rows } = await sql<{
      nombre: string;
      total_sold: number;
      total_revenue: number;
    }>(`
      SELECT
        p.nombre,
        COALESCE(SUM(dp.cantidad), 0) as total_sold,
        COALESCE(SUM(dp.subtotal), 0) as total_revenue
      FROM public.producto p
      LEFT JOIN public.detalle_pedido dp ON p.idproducto = dp.id_producto
      WHERE p.estados = 'Disponible'
      GROUP BY p.idproducto, p.nombre
      HAVING COALESCE(SUM(dp.cantidad), 0) > 0
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Calcular participación total para porcentajes
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.total_revenue), 0);

    return rows.map(row => ({
      name: row.nombre,
      sold: Number(row.total_sold),
      revenue: Number(row.total_revenue),
      share: totalRevenue > 0 ? Math.round((Number(row.total_revenue) / totalRevenue) * 100) : 0,
    }));
  } catch (error) {
    console.error("Error obteniendo productos top:", error);
    return productDetails.map((product) => ({
      name: product.name,
      sold: product.sold,
      revenue: product.revenue,
      share: product.share,
    }));
  }
}

export default async function InformeProductoPage() {
  const [statsData, productsData] = await Promise.all([
    getProductStats(),
    getTopProducts(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-4xl border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Informe por producto
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Rendimiento de productos
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Revisa ventas, participación y comportamiento de producto para tomar decisiones rápidas desde un panel limpio y bien delimitado.
              </p>
            </div>

            <Link
              href="/user/admin/informes"
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver a informes
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total productos</p>
              <p className="mt-3 text-3xl font-bold text-white">{statsData.totalProducts}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ventas totales</p>
              <p className="mt-3 text-3xl font-bold text-white">{statsData.totalSales.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ticket promedio</p>
              <p className="mt-3 text-3xl font-bold text-white">${statsData.averageTicket.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <ProductReportShell summary={statsData} topProducts={productsData} initialProducts={productDetails} />
      </div>
    </main>
  );
}
