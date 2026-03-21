import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserFromSession } from "@/app/Datalibs/auth";
import Image from "next/image";

export default async function UserPage() {
  const user = await getUserFromSession();

  if (!user) {
    redirect("/account/login");
  }

  return (
    <section className="bg-white py-3 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-1 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="grid min-h-[620px] lg:grid-cols-[38%_42%_20%]">
            {/* Imagen izquierda grande */}
            <div className="relative min-h-[420px] bg-white">
              <Image
                src="/img/descorchar.jpg"
                alt="Botella de vino"
                fill
                priority
                quality={90}
                className="object-contain object-left-bottom scale-105"
                sizes="(max-width: 1024px) 100vw, 38vw"
              />
            </div>

            {/* Contenido central */}
            <div className="flex items-center bg-white px-6 py-10 sm:px-8 lg:px-10">
              <div className="w-full">
                <header className="mb-6 text-center">
                  <h1 className="text-3xl font-extrabold italic tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    ¡Bienvenido a DrinkWare!
                  </h1>
                  <p className="mt-3 text-base text-1xl text-slate-600 sm:text-lg">
                    Descubre lo nuevo y navega por los apartados disponibles.
                  </p>
                </header>

                <div className="space-y-5 text-justify text-base leading-8 text-slate-700 sm:text-lg">
                  <p>
                    ¡Bienvenido{" "}
                    <span className="font-semibold text-slate-900">
                      {user.nombre || user.nombreusuario}
                    </span>
                    ! Tu tienda de licores en línea donde lo importante es
                    comprar fácil y recibir rápido. Tenemos de todo:
                    aguardientes, rones, cervezas artesanales y vinos para cada
                    ocasión.
                  </p>

                  <p>
                    Cada compra está cubierta por nuestra garantía de
                    distribuidora y un equipo de soporte que te ayuda si lo
                    necesitas. Haz tu pedido de forma segura, paga como
                    prefieras y aprovecha la entrega a domicilio con tiempos
                    cortos y seguimiento.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/productos"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    Ver nuestros productos
                  </Link>

                  <Link
                    href="/pqrs/contactenos"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:text-sky-600"
                  >
                    Contáctenos
                  </Link>
                </div>
              </div>
            </div>

            {/* Imagen derecha */}
            <div className="flex items-center justify-center bg-white p-6 lg:p-4">
              <div className="w-full max-w-[240px]">
                <Image
                  src="/img/rones.png"
                  alt="Productos destacados"
                  width={400}
                  height={300}
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
