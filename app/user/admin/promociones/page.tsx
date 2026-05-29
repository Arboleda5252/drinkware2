import Image from "next/image";
import Link from "next/link";
import {
  FaBolt,
  FaCircleCheck,
  FaFireFlameCurved,
  FaGift,
  FaShieldHeart,
  FaStar,
  FaTruckFast,
  FaWhatsapp,
  FaWineBottle,
} from "react-icons/fa6";

const promotions = [
  {
    name: "Ron Premium 750 ml",
    oldPrice: "$48.000",
    newPrice: "$39.900",
    tag: "HOT",
    accent: "from-cyan-400/20 via-sky-500/10 to-transparent",
    image: "/productos/ronM12750.png",
    description: "Sabor suave, finish elegante y edición limitada para tus fiestas.",
  },
  {
    name: "Whisky Reserva 1L",
    oldPrice: "$72.000",
    newPrice: "$59.900",
    tag: "2x1",
    accent: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
    image: "/productos/agtManzanares750.webp",
    description: "Aromas profundos, cuerpo premium y presentación de alto standing.",
  },
  {
    name: "Combo Fiesta Night",
    oldPrice: "$95.000",
    newPrice: "$79.900",
    tag: "Promo Weekend",
    accent: "from-amber-400/20 via-rose-500/10 to-transparent",
    image: "/productos/agtAzul750.png",
    description: "Incluye dos botellas seleccionadas y accesorios para tu noche.",
  },
  {
    name: "Cerveza Premium Six Pack",
    oldPrice: "$34.000",
    newPrice: "$27.900",
    tag: "Top Ventas",
    accent: "from-emerald-400/20 via-cyan-500/10 to-transparent",
    image: "/productos/cer_pilsen_six.png",
    description: "Perfecta para reuniones, clubbing o celebraciones con amigos.",
  },
];

const categories = [
  { name: "Whisky", image: "/img/caldas.jpg", tone: "from-amber-400/20 to-slate-950/90" },
  { name: "Ron", image: "/productos/ronC260.png", tone: "from-cyan-400/20 to-slate-950/90" },
  { name: "Tequila", image: "/productos/embajadorBlanco.png", tone: "from-violet-500/20 to-slate-950/90" },
  { name: "Vodka", image: "/productos/agtVerde750.webp", tone: "from-emerald-400/20 to-slate-950/90" },
  { name: "Cervezas", image: "/img/cervezas.png", tone: "from-rose-400/20 to-slate-950/90" },
  { name: "Cócteles", image: "/img/copa.png", tone: "from-sky-400/20 to-slate-950/90" },
];

const benefits = [
  { icon: FaTruckFast, title: "Entrega rápida", text: "Despachos ágiles y seguimiento en tiempo real." },
  { icon: FaShieldHeart, title: "Productos originales", text: "Marcas confirmadas y stock garantizado." },
  { icon: FaGift, title: "Promociones exclusivas", text: "Ofertas VIP y packs especiales por temporada." },
  { icon: FaCircleCheck, title: "Atención personalizada", text: "Asesoría para elegir la mejor opción para cada ocasión." },
  { icon: FaBolt, title: "Compra segura", text: "Pagos protegidos y experiencia premium desde el primer clic." },
];

const testimonials = [
  {
    name: "Camila R.",
    role: "Cliente premium",
    quote: "La mejor experiencia de compra; promociones muy atractivas y entrega impecable.",
    image: "/img/club.jpg",
  },
  {
    name: "Andrés M.",
    role: "Eventos y fiestas",
    quote: "Compré un combo para una celebración y todo salió perfecto, con excelente atención.",
    image: "/img/descorchar.jpg",
  },
  {
    name: "Laura T.",
    role: "Cliente frecuente",
    quote: "Los descuentos son reales y el diseño de la tienda se siente muy premium.",
    image: "/img/vino.jpg",
  },
];

export default function PromocionesPage() {
  return (
    <main className="min-h-screen bg-[#040b14] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.12),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(123,46,255,0.16),_transparent_20%),linear-gradient(135deg,#040b14_0%,#071120_45%,#0b1e36_100%)]" />
        <div className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-16 lg:py-20">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100 shadow-[0_0_30px_rgba(0,212,255,0.12)]">
              <FaFireFlameCurved className="text-cyan-300" />
              Promociones premium para noches inolvidables
            </p>

            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-black tracking-[0.08em] text-white sm:text-5xl lg:text-6xl">
                Las mejores promociones para tus mejores noches
              </h1>
              <p className="max-w-lg text-lg text-slate-200/90 sm:text-xl">
                Descubre licores premium, packs exclusivos y descuentos irresistibles con la energía moderna de Drinkware.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="#promociones" className="rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(56,189,248,0.5)]">
                Ver promociones
              </Link>
              <Link href="https://wa.me/573001234567" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15">
                Pedir por WhatsApp
              </Link>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/30 backdrop-blur-md sm:grid-cols-3">
              {[
                ["+120", "productos premium"],
                ["24/7", "atención y pedidos"],
                ["95%", "clientes satisfechos"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center">
                  <p className="text-2xl font-black text-cyan-200">{value}</p>
                  <p className="text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] rounded-[32px] border border-white/10 bg-white/8 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute bottom-10 right-8 h-20 w-20 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative h-full rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(7,17,32,0.92),rgba(11,30,54,0.86))] p-4">
              <Image
                src="/img/club.jpg"
                alt="Botellas premium y ambiente nocturno de Drinkware"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="rounded-[24px] object-cover opacity-90"
              />
              <div className="absolute inset-0 rounded-[24px] bg-[linear-gradient(180deg,rgba(7,17,32,0.15)_0%,rgba(7,17,32,0.72)_100%)]" />
              <div className="absolute left-6 top-6 rounded-2xl border border-cyan-400/25 bg-slate-950/50 p-4 text-white shadow-xl backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200">Oferta del día</p>
                <p className="mt-1 text-xl font-black">2x1 en botellas seleccionadas</p>
                <p className="text-sm text-slate-200">Perfecto para cerrar con estilo tu celebración.</p>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur-md">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200">Entrega</p>
                  <p className="text-xl font-semibold text-white">24h · rápida y segura</p>
                </div>
                <button className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-slate-950">Comprar ahora</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="promociones" className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Promociones</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Lo más pedido esta semana</h2>
          </div>
          <p className="max-w-xl text-slate-300">Descuentos exclusivos, packs de fiesta y productos premium con diseño moderno para que cada compra se sienta especial.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {promotions.map((promo) => (
            <article key={promo.name} className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_28px_60px_rgba(0,212,255,0.18)]">
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${promo.accent}`} />
              <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/70">
                <Image src={promo.image} alt={promo.name} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-contain p-3 transition duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-lg">{promo.tag}</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-white">{promo.name}</h3>
                  <FaWineBottle className="text-cyan-200" />
                </div>
                <p className="text-sm text-slate-300">{promo.description}</p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400 line-through">{promo.oldPrice}</p>
                    <p className="text-2xl font-black text-cyan-100">{promo.newPrice}</p>
                  </div>
                  <button className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-400/20">Agregar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 sm:px-10 lg:px-16">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Categorías</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Explora por estilo y ocasión</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((item) => (
            <article key={item.name} className="group relative h-48 overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,32,0.15),rgba(7,17,32,0.82))]" />
              <div className={`absolute inset-0 bg-gradient-to-br ${item.tone} opacity-80 transition duration-300 group-hover:opacity-60`} />
              <div className="relative z-10 flex h-full flex-col justify-end p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-100">Selección</p>
                <h3 className="text-2xl font-black text-white">{item.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 sm:px-10 lg:px-16">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,18,32,0.97),rgba(7,17,32,0.92))] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] lg:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">¿Por qué elegir Drinkware?</p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Calidad premium, velocidad y confianza</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className="rounded-[24px] border border-white/10 bg-white/6 p-5 text-center shadow-xl shadow-black/20 backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-100 shadow-[0_0_25px_rgba(56,189,248,0.18)]">
                    <Icon className="text-xl" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{benefit.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Testimonios</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="hidden items-center gap-1 text-amber-300 md:flex">
            {Array.from({ length: 5 }).map((_, index) => (<FaStar key={index} />))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-cyan-400/30">
                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <p className="text-sm text-slate-300">{item.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-200">“{item.quote}”</p>
              <div className="mt-4 flex gap-1 text-amber-300">{Array.from({ length: 5 }).map((_, index) => (<FaStar key={index} className="text-sm" />))}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[linear-gradient(135deg,#071120_0%,#0b1e36_45%,#120b1d_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(123,46,255,0.16),_transparent_18%)]" />
          <div className="relative z-10 flex flex-col gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">CTA final</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Haz tu pedido ahora y vive la experiencia Drinkware</h2>
              <p className="mt-3 text-slate-200">Promociones exclusivas, entrega ágil y selección premium para cada celebración.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-end">
              <Link href="https://wa.me/573001234567" target="_blank" rel="noreferrer" className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition hover:-translate-y-0.5">Escríbenos por WhatsApp</Link>
              <Link href="#promociones" className="rounded-full border border-white/15 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15">Ver promociones</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#040b14]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm text-slate-300 sm:px-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr] lg:px-16">
          <div>
            <h3 className="text-xl font-black text-white">Drinkware</h3>
            <p className="mt-3 max-w-sm text-slate-300">Promociones premium, licor exclusivo y una experiencia moderna para celebraciones inolvidables.</p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Contacto</h4>
            <ul className="mt-3 space-y-2">
              <li>WhatsApp: +57 300 123 4567</li>
              <li>Email: hola@drinkware.co</li>
              <li>Medellín, Colombia</li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Métodos de pago</h4>
            <ul className="mt-3 space-y-2">
              <li>Nequi</li>
              <li>Daviplata</li>
              <li>Tarjeta · PSE</li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Horarios</h4>
            <ul className="mt-3 space-y-2">
              <li>Lun–Dom: 24 horas</li>
              <li>Entrega rápida en Medellín</li>
              <li>Atención por WhatsApp</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-center text-xs uppercase tracking-[0.3em] text-slate-400 sm:px-10 lg:px-16">© 2026 Drinkware. Todos los derechos reservados.</div>
      </footer>
    </main>
  );
}
