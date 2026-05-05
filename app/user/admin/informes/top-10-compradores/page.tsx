import Link from "next/link";

const buyers = [
  {
    name: "Marta R.",
    total: 152480,
    frequency: "5 compras/mes",
    avgTicket: 30496,
    lastPurchase: "3 días",
    category: "VIP",
    color: "from-amber-400 to-orange-500",
    insight: "Compra premium cada semana, merece oferta exclusiva.",
    habit: "Compra fines de semana",
  },
  {
    name: "Diego S.",
    total: 91200,
    frequency: "4 compras/mes",
    avgTicket: 22800,
    lastPurchase: "6 días",
    category: "VIP",
    color: "from-amber-400 to-orange-500",
    insight: "Alto gasto frecuente. Envío de acceso anticipado ideal.",
    habit: "Prefiere whiskey premium",
  },
  {
    name: "Laura V.",
    total: 48500,
    frequency: "6 compras/mes",
    avgTicket: 8083,
    lastPurchase: "2 días",
    category: "Frecuente",
    color: "from-sky-500 to-blue-600",
    insight: "Compra seguido pero ticket moderado. Combo 2x1 recomendado.",
    habit: "Busca mixers y aguardiente",
  },
  {
    name: "Hugo P.",
    total: 39200,
    frequency: "5 compras/mes",
    avgTicket: 7840,
    lastPurchase: "9 días",
    category: "Frecuente",
    color: "from-sky-500 to-blue-600",
    insight: "Buen ritmo. Incentivo: compra $50.000 y recibe producto extra.",
    habit: "Compra los viernes",
  },
  {
    name: "Camila T.",
    total: 71000,
    frequency: "1 compra/mes",
    avgTicket: 71000,
    lastPurchase: "20 días",
    category: "Alto valor",
    color: "from-violet-500 to-fuchsia-600",
    insight: "Ticket alto ocasional. Retención con cupón 15% ideal.",
    habit: "Prefiere tequila premium",
  },
  {
    name: "Sergio M.",
    total: 66800,
    frequency: "2 compras/mes",
    avgTicket: 33400,
    lastPurchase: "12 días",
    category: "Alto valor",
    color: "from-violet-500 to-fuchsia-600",
    insight: "Necesita recordatorio: hace rato no compra. Cupón de regreso.",
    habit: "Compra para eventos especiales",
  },
  {
    name: "Ana G.",
    total: 55800,
    frequency: "3 compras/mes",
    avgTicket: 18600,
    lastPurchase: "4 días",
    category: "Frecuente",
    color: "from-sky-500 to-blue-600",
    insight: "Con buena recurrencia. Sugerir combo personal.",
    habit: "Prefiere cervezas artesanales",
  },
  {
    name: "Daniel C.",
    total: 88000,
    frequency: "2 compras/mes",
    avgTicket: 44000,
    lastPurchase: "18 días",
    category: "Alto valor",
    color: "from-violet-500 to-fuchsia-600",
    insight: "Ticket subiendo. Potencial VIP si aumenta frecuencia.",
    habit: "Compra vino tinto",
  },
  {
    name: "Natalia Q.",
    total: 132500,
    frequency: "4 compras/mes",
    avgTicket: 33125,
    lastPurchase: "5 días",
    category: "VIP",
    color: "from-amber-400 to-orange-500",
    insight: "VIP sólida. Recompensa con regalo y descuento 15%.",
    habit: "Compra antes del fin de semana",
  },
  {
    name: "Rodrigo F.",
    total: 29800,
    frequency: "1 compra/mes",
    avgTicket: 29800,
    lastPurchase: "28 días",
    category: "Alto valor",
    color: "from-violet-500 to-fuchsia-600",
    insight: "Muy espaciado. Cupón de retorno para recompra rápida.",
    habit: "Compra ocasiones especiales",
  },
];

const notifications = [
  {
    title: "VIP sin comprar hace 15 días",
    description: "Marta R. no tiene nueva compra desde hace 3 días, pero otro VIP ya llega a la marca de 15.",
    label: "Atención VIP",
    color: "bg-amber-500/10 text-amber-200",
  },
  {
    title: "Potencial VIP detectado",
    description: "Daniel C. aumentó su ticket en 30% y está cerca de subir a VIP si mejora frecuencia.",
    label: "Oportunidad",
    color: "bg-cyan-500/10 text-cyan-200",
  },
  {
    title: "Bajada de ticket",
    description: "Hugo P. redujo su gasto promedio. Activar oferta de 2x1 para recuperar su hábito.",
    label: "Recuperación",
    color: "bg-violet-500/10 text-violet-200",
  },
];

const featurePromos = [
  {
    title: "VIP: Acceso anticipado + descuentos",
    description: "10-15% exclusivo, botella pequeña o mixers de regalo para clientes Oro.",
    color: "from-amber-400 to-orange-500",
  },
  {
    title: "Frecuente: Combos personalizados",
    description: "Ofrece " + '"Llévate 2 y te damos descuento"' + " para compradores constantes.",
    color: "from-sky-500 to-blue-600",
  },
  {
    title: "Alto valor: Cupón de regreso",
    description: "Manda cupones 15% para reactivar clientes con alto ticket ocasional.",
    color: "from-violet-500 to-fuchsia-600",
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export default function Top10CompradoresPage() {
  const totalSum = buyers.reduce((sum, buyer) => sum + buyer.total, 0);
  const avgTicket = Math.round(buyers.reduce((sum, buyer) => sum + buyer.avgTicket, 0) / buyers.length);

  return (
    <main className="min-h-screen bg-slate-950/40 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="overflow-hidden rounded-4xl border border-sky-400/20 bg-slate-900/90 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-10">
          <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <span className="inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                  Top 10 compradores
                </span>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Gestión VIP y promociones para los mejores clientes
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Total comprado, frecuencia, ticket promedio y última compra. Clasificación automática en Oro, Plata y Moreno con acciones rápidas y notificaciones inteligentes.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-slate-700/60">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Clientes analizados</p>
                  <p className="mt-3 text-2xl font-bold text-white">10</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-slate-700/60">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Total comprado</p>
                  <p className="mt-3 text-2xl font-bold text-white">{formatMoney(totalSum)}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-slate-700/60">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Ticket promedio</p>
                  <p className="mt-3 text-2xl font-bold text-white">{formatMoney(avgTicket)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.28)]">
                <p className="text-sm uppercase tracking-[0.25em] text-amber-300">VIP (Oro)</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Descuentos exclusivos</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">10-15%, acceso anticipado y regalos especiales para los clientes con mayor gasto y frecuencia.</p>
              </div>
              <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.28)]">
                <p className="text-sm uppercase tracking-[0.25em] text-sky-300">Frecuente (Plata)</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Combos personalizados</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">Ofrece promos 2x1 y descuentos por volumen para fidelizar clientes que compran seguido.</p>
              </div>
              <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.28)]">
                <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Alto valor</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Reactivación con cupones</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">Clientes con ticket alto pero baja frecuencia reciben cupones para volver y subir su recurrencia.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-4xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Total comprado</p>
                <p className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl wrap-break-word whitespace-normal">{formatMoney(totalSum)}</p>
                <p className="mt-2 text-sm text-slate-400">Suma de los 10 compradores principales.</p>
              </div>
              <div className="rounded-4xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Frecuencia</p>
                <p className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl wrap-break-word whitespace-normal">5 compras/mes</p>
                <p className="mt-2 text-sm text-slate-400">Promedio de recurrencia entre los clientes top.</p>
              </div>
              <div className="rounded-4xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Ticket promedio</p>
                <p className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl wrap-break-word whitespace-normal">{formatMoney(avgTicket)}</p>
                <p className="mt-2 text-sm text-slate-400">Mide el gasto promedio por cliente.</p>
              </div>
              <div className="rounded-4xl border border-slate-800/80 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Última compra</p>
                <p className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl wrap-break-word whitespace-normal">2-28 días</p>
                <p className="mt-2 text-sm text-slate-400">Identifica quién necesita reactivación urgente.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-4xl border border-white/10 bg-slate-950/80 shadow-[0_18px_64px_rgba(15,23,42,0.3)]">
              <div className="border-b border-slate-800/70 bg-slate-900/80 px-6 py-5 sm:px-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Ranking</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Top 10 compradores</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300 ring-1 ring-slate-700/80">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> VIP
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Frecuente
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Alto valor
                  </div>
                </div>
              </div>
              <div className="px-2 py-4 sm:px-4">
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 sm:grid-cols-[0.9fr_1fr_1fr_1fr_1fr]">
                  <span>Cliente</span>
                  <span>Total</span>
                  <span>Frecuencia</span>
                  <span>Ticket</span>
                  <span>Última compra</span>
                </div>
                <div className="divide-y divide-slate-800/70">
                  {buyers.map((buyer, index) => (
                    <div key={buyer.name} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-4 text-sm sm:grid-cols-[0.9fr_1fr_1fr_1fr_1fr]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${buyer.color} text-sm font-black text-slate-950`}>{index < 3 ? ['🥇','🥈','🥉'][index] : index + 1}</span>
                          <div>
                            <p className="font-semibold text-white">{buyer.name}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{buyer.category}</p>
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold text-white">{formatMoney(buyer.total)}</p>
                      <p className="text-slate-300">{buyer.frequency}</p>
                      <p className="text-slate-300">{formatMoney(buyer.avgTicket)}</p>
                      <p className="text-slate-300">{buyer.lastPurchase}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_64px_rgba(15,23,42,0.25)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Sugerencias</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Promociones recomendadas</h2>
                </div>
                <Link href="#acciones" className="inline-flex items-center rounded-3xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20">
                  Ver acciones rápidas
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {featurePromos.map((promo) => (
                  <div key={promo.title} className={`rounded-3xl border border-slate-800/80 bg-linear-to-br ${promo.color} p-5 shadow-xl shadow-slate-950/30`}>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-950/80">{promo.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-950/95">{promo.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-4xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-[0_18px_64px_rgba(15,23,42,0.25)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Notificaciones automáticas</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M18 8a6 6 0 1 0-12 0c0 5-3 6-3 6h18s-3-1-3-6" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <h2 className="text-2xl font-bold text-white">Alertas inteligentes</h2>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {notifications.map((note) => (
                  <div key={note.title} className={`rounded-3xl border border-slate-800/80 p-4 ${note.color}`}>
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <p className="min-w-0 text-sm font-semibold text-white truncate">{note.title}</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/80">{note.label}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/80 wrap-break-word">{note.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="acciones" className="rounded-4xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-[0_18px_64px_rgba(15,23,42,0.25)]">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Acciones rápidas</p>
              <h2 className="mt-3 text-2xl font-bold text-white">Enviar promoción en un clic</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Selecciona un cliente y ejecuta la acción desde aquí para mantener el flujo activo.</p>
              <div className="mt-6 grid gap-3">
                {[
                  { label: "Enviar promoción", tone: "bg-sky-500/10 text-sky-200" },
                  { label: "Crear cupón", tone: "bg-emerald-500/10 text-emerald-200" },
                  { label: "Ver historial", tone: "bg-violet-500/10 text-violet-200" },
                  { label: "Contactar por WhatsApp", tone: "bg-fuchsia-500/10 text-fuchsia-200" },
                ].map((action) => (
                  <button key={action.label} className={`w-full rounded-3xl border border-white/10 px-4 py-3 text-left text-sm font-semibold transition hover:border-sky-300/40 hover:bg-slate-800/70 ${action.tone}`}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-[0_18px_64px_rgba(15,23,42,0.25)]">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Detección de hábitos</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-slate-200">Aguardiente premium</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Cliente compra aguardiente frecuentemente. Sugerir combo premium con mixers.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-slate-200">Promo viernes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Detectamos compras recurrentes los fines de semana. Envía ofertas el jueves noche.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
