"use client";

import Image from "next/image";
import * as React from "react";

const slides = [
  { src: "/img/cervezas.png", alt: "Catalogo de cervezas premium" },
  { src: "/img/rones.png", alt: "Seleccion exclusiva de rones" },
  { src: "/img/vino.jpg", alt: "Vinos para cada celebracion" },
  { src: "/img/descorchar.jpg", alt: "Momentos para brindar con Drinkware" },
  { src: "/img/copa.png", alt: "Experiencias inolvidables con licores" },
];

export default function Page() {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const goToSlide = React.useCallback((index: number) => {
    setCurrentSlide((index + slides.length) % slides.length);
  }, []);

  return (
    <main className="bg-gray-100 text-gray-800">
      <section className="relative mt-16 h-[480px] overflow-hidden rounded-b-3xl bg-black shadow-2xl md:h-[540px]">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={index !== currentSlide}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/30" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white sm:px-8">
         
          <h1 className="text-3xl font-extrabold uppercase tracking-[0.3em] text-sky-400 drop-shadow md:text-5xl">
            Drinkware
          </h1>
          <p className="mt-6 max-w-3xl text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
            Somos tu distribuidora de licores comprometida con ofrecer productos de alta
            calidad y un excelente servicio. Contamos con un catalogo variado que satisface
            los gustos de todos nuestros clientes, siempre garantizando confianza,
            cumplimiento y responsabilidad.
          </p>
        </div>

        <button
          type="button"
          onClick={() => goToSlide(currentSlide - 1)}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Anterior"
        >
          <span aria-hidden className="text-2xl leading-none">
            &lt;
          </span>
        </button>
        <button
          type="button"
          onClick={() => goToSlide(currentSlide + 1)}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Siguiente"
        >
          <span aria-hidden className="text-2xl leading-none">
            &gt;
          </span>
        </button>

        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                index === currentSlide ? "bg-white" : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Ir a la imagen ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section
        id="quienes-somos"
        className="mx-auto my-16 max-w-5xl rounded-xl bg-white p-8 shadow-lg"
      >
        <h2 className="relative pb-3 text-center text-3xl font-bold text-purple-700 after:mt-3 after:block after:h-1 after:w-20 after:bg-pink-600 after:content-['']">
          Quienes Somos?
        </h2>
        <p className="mt-6 text-lg text-justify">
          En <strong>Drinkware</strong> somos una distribuidora de licores comprometida con
          ofrecer productos de alta calidad y un excelente servicio. Contamos con un
          catalogo variado que satisface los gustos de todos nuestros clientes, siempre
          garantizando confianza, cumplimiento y responsabilidad.
        </p>
      </section>

      <section
        id="mision"
        className="mx-auto my-16 max-w-5xl rounded-xl bg-white p-8 shadow-lg"
      >
        <h2 className="relative pb-3 text-center text-3xl font-bold text-purple-700 after:mt-3 after:block after:h-1 after:w-20 after:bg-pink-600 after:content-['']">
          Mision
        </h2>
        <p className="mt-6 text-lg text-justify">
          Nuestra mision es llevar a cada cliente experiencias unicas a traves de la
          distribucion responsable de licores nacionales e internacionales, ofreciendo
          precios competitivos y un servicio agil y seguro.
        </p>
      </section>

      <section
        id="vision"
        className="mx-auto my-16 max-w-5xl rounded-xl bg-white p-8 shadow-lg"
      >
        <h2 className="relative pb-3 text-center text-3xl font-bold text-purple-700 after:mt-3 after:block after:h-1 after:w-20 after:bg-pink-600 after:content-['']">
          Vision
        </h2>
        <p className="mt-6 text-lg text-justify">
          Ser reconocidos como la distribuidora de licores lider en el pais,
          destacandonos por la innovacion, la confianza y el compromiso con nuestros
          clientes, proveedores y la comunidad.
        </p>
      </section>

      <section
        id="valor-agregado"
        className="mx-auto my-16 max-w-5xl rounded-xl border-l-8 border-orange-500 bg-orange-50 p-8 shadow-lg"
      >
        <h2 className="relative pb-3 text-center text-3xl font-bold text-orange-600 after:mt-3 after:block after:h-1 after:w-20 after:bg-orange-500 after:content-['']">
          Valor Agregado
        </h2>
        <ul className="mt-6 list-inside list-disc space-y-3 text-lg">
          <li>
            <strong>Atencion personalizada:</strong> servicio cercano, adaptado a las
            necesidades de cada cliente.
          </li>
          <li>
            <strong>Variedad de productos:</strong> amplio portafolio de licores nacionales e
            importados con disponibilidad inmediata.
          </li>
          <li>
            <strong>Distribucion rapida:</strong> sistema logistico eficiente para que tu pedido
            llegue a tiempo y en perfectas condiciones.
          </li>
        </ul>
      </section>
    </main>
  );
}
