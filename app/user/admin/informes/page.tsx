import Link from "next/link";

const reports = [
  {
    title: "Informe Trimestral",
    description: "Análisis completo: ventas, categorías, horarios pico y rentabilidad por trimestre.",
    href: "/user/admin/informes/trimestral",
    badge: "Trimestre",
  },
  {
    title: "Inventario de productos",
    description: "Visualiza la rotación y el estado del inventario por producto.",
    href: "/user/admin/informes/productos",
    badge: "Inventario",
  },
  {
    title: "Informe por cliente",
    description: "Identifica a tus consumidores frecuentes y sus preferencias.",
    href: "/user/admin/informes/cliente",
    badge: "Cliente",
  },
  {
    title: "Top 10 licores",
    description: "Descubre los 10 productos que más rotan en la tienda.",
    href: "/user/admin/informes/top-10-licores",
    badge: "Top 10",
  },
  {
    title: "Top 10 compradores",
    description: "Los clientes con mayor ticket promedio y recurrencia.",
    href: "/user/admin/informes/top-10-compradores",
    badge: "Top 10",
  },
];

export default function InformesPage() {
  return (
    <main className="min-h-screen bg-slate-950/40 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-4xl border border-sky-400/20 bg-slate-900/90 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-10">
          <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-12">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Informe licorero
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Panel de gestión para tu licorería
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Todo lo de tu licorera en un solo lugar, pa’ que la tengas bajo control y manejes tu negocio fácil, sin complicarte.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {reports.map((report) => (
                <Link
                  key={report.title}
                  href={report.href ?? "#"}
                  className="rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-4 text-left transition hover:border-sky-300/40 hover:bg-slate-800/80"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                      {report.badge}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Ver informe
                    </span>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-white">{report.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{report.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-4xl border border-white/10 bg-slate-900/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/80">
              Vista rápida
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Tu licorería bajo control
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              Como administrador y dueño, necesitas ver el pulso del negocio al instante: rotación de botellas, margen de marcas premium y demanda por categoría.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/user/admin/informes/productos"
                className="group rounded-3xl bg-slate-950/70 p-5 ring-1 ring-slate-700/60 transition hover:ring-sky-400/50 hover:bg-slate-900/50 cursor-pointer"
              >
                <p className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition">Inventario de productos</p>
                <p className="mt-2 text-sm text-slate-400 group-hover:text-slate-300 transition">Visualiza la rotación y el estado de tu inventario por producto.</p>
              </Link>
              <div className="rounded-3xl bg-slate-950/70 p-5 ring-1 ring-slate-700/60">
                <p className="text-sm font-semibold text-slate-200">Ventas por categoría</p>
                <p className="mt-2 text-sm text-slate-400">Conoce qué segmentos de la tienda generan mayor margen.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/70 p-5 ring-1 ring-slate-700/60">
                <p className="text-sm font-semibold text-slate-200">Clientes premium</p>
                <p className="mt-2 text-sm text-slate-400">Identifica compradores frecuentes y su ticket promedio.</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5 ring-1 ring-slate-700/60">
                <p className="text-sm font-semibold text-slate-200">Combinación de productos</p>
                <p className="mt-2 text-sm text-slate-400">Aprovecha insights para armar promociones y ofertas cruzadas.</p>
              </div>
            </div>
          </article>

          <aside className="rounded-4xl border border-sky-400/10 bg-slate-950/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="rounded-[1.75rem] border border-slate-800/90 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/80">
                Indicadores licoreros
              </p>
              <h3 className="mt-4 text-2xl font-bold text-white">Decisiones rápidas para tu negocio</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Revisa en segundos los números más importantes para una licorería: stock premium, rotación por marca y flujo de compras recurrentes.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/80 px-4 py-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Botellas vendidas</p>
                  <p className="mt-2 text-3xl font-bold text-white">3,420</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 px-4 py-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Stock premium</p>
                  <p className="mt-2 text-3xl font-bold text-white">76</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
