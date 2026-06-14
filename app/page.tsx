"use client";

import Image from "next/image";
import Link from "next/link";

const featuredImages = [
  {
    src: "/img/caldas.jpg",
    alt: "Catálogo de rones premium",
  },
  {
    src: "/img/vino.jpg",
    alt: "Vinos para cada celebración",
  },
  {
    src: "/img/club.jpg",
    alt: "Selección exclusiva de cervezas artesanales",
  },
];

export default function Page() {
  return (
    <main className="bg-black text-gray-800">
      <section className="relative overflow-hidden rounded-b-[1.75rem] bg-[#0b1220] shadow-2xl sm:rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

        <div className="relative z-10 mx-auto grid min-h-[auto] max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 sm:min-h-[680px] sm:px-10 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-16">
          <div className="relative mx-auto h-[280px] w-full max-w-[360px] sm:h-[430px] sm:max-w-[520px]">
            <div className="absolute left-4 top-10 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute bottom-6 right-10 h-24 w-24 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute left-0 top-[64px] h-[190px] w-[190px] overflow-hidden rounded-full border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.35)] sm:top-[88px] sm:h-[340px] sm:w-[340px]">
              <Image
                src={featuredImages[0].src}
                alt={featuredImages[0].alt}
                fill
                sizes="(max-width: 640px) 290px, 340px"
                className="object-cover object-center brightness-110 contrast-125 saturate-150"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
            </div>

            <div className="absolute right-4 top-0 h-[108px] w-[108px] overflow-hidden rounded-full border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.3)] sm:right-6 sm:h-[180px] sm:w-[180px]">
              <Image
                src={featuredImages[1].src}
                alt={featuredImages[1].alt}
                fill
                sizes="(max-width: 640px) 150px, 180px"
                className="object-cover object-center brightness-110 contrast-125 saturate-150"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="absolute bottom-2 right-0 h-[116px] w-[116px] overflow-hidden rounded-full border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.3)] sm:h-[190px] sm:w-[190px]">
              <Image
                src={featuredImages[2].src}
                alt={featuredImages[2].alt}
                fill
                sizes="(max-width: 640px) 160px, 190px"
                className="object-cover object-center brightness-110 contrast-125 saturate-150"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="absolute bottom-0 left-4 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md sm:text-sm">
              Entrega rápida
            </div>
          </div>

          <div className="w-full">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:rounded-[2rem] sm:p-8 md:p-10">
              <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-[0.08em] text-white sm:mt-5 sm:text-5xl sm:tracking-[0.18em] md:text-6xl">
                Drinkware
              </h1>

              <p className="mt-5 text-sm leading-7 text-white/85 [text-align:justify] sm:mt-6 sm:text-lg sm:leading-8">
                Descubre una experiencia moderna y confiable para comprar tus
                bebidas favoritas en un solo lugar. En{" "}
                <span className="font-semibold text-sky-300">Drinkware</span> encontrarás
                una cuidada selección de{" "}
                <span className="font-semibold text-white">
                  aguardientes, cervezas, rones, whisky, vinos
                </span>{" "}
                y mucho más, pensada para reuniones, celebraciones, fiestas, regalos especiales o
                simplemente para disfrutar productos de excelente calidad en cualquier
                momento.
              </p>

              <p className="mt-4 text-sm leading-7 text-white/78 [text-align:justify] sm:text-lg sm:leading-8">
                Nuestra página está diseñada para que puedas{" "}
                <span className="font-semibold text-white">registrarte fácilmente</span>,
                explorar el catálogo, comprar de forma rápida y elegir la opción que más
                te convenga:{" "}
                <span className="font-semibold text-white">retiro en tienda</span> o{" "}
                <span className="font-semibold text-white">entrega a domicilio</span>. Te
                ofrecemos una atención cercana, ágil y disponible para acompañarte en cada
                compra con comodidad y seguridad.
              </p>

              <p className="mt-4 text-sm leading-7 text-white/78 [text-align:justify] sm:text-lg sm:leading-8">
                También puedes visitarnos en nuestra tienda ubicada en{" "}
                <span className="font-semibold text-white">
                  Calle 123 # 45-67, Medellín, Colombia
                </span>
                . Estamos disponibles{" "}
                <span className="font-semibold text-white">las 24 horas</span> para
                atenderte. Si prefieres comunicarte con nosotros, puedes hacerlo por{" "}
                <span className="font-semibold text-white">WhatsApp o llamada</span> al{" "}
                <span className="font-semibold text-sky-300">+57 300 123 4567</span>.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:flex-wrap sm:justify-center">
                <Link
                  href="/pqrs/nosotros"
                  className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/40 bg-sky-400/10 px-6 py-3 text-sm font-semibold text-sky-100 transition duration-300 hover:scale-[1.02] hover:bg-sky-400/20 sm:min-w-[220px] sm:w-auto"
                >
                  Quienes somos
                </Link>

                <Link
                  href="/productos"
                  className="inline-flex w-full items-center justify-center rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:scale-[1.02] hover:bg-sky-300 sm:min-w-[220px] sm:w-auto"
                >
                  Explorar Productos
                </Link>

                <Link
                  href="/pqrs/contactenos"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/20 sm:min-w-[220px] sm:w-auto"
                >
                  Contáctanos
                </Link>
              </div>

              <div className="mt-7 grid gap-3 text-sm text-center text-white/75 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <span className="block font-semibold text-white py-3">Compra en tienda</span>
                  Elige, paga y recoge a tu ritmo: rápido, seguro y cómodo.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <span className="block font-semibold text-white py-3">Domicilio</span>
                  Recibe tus productos de forma rápida y segura.
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <span className="block font-semibold text-white py-3">Disponibilidad 24/7</span>
                  Atención continua para cualquier ocasión.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
