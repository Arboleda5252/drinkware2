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
    <section className="space-y-6">
      <div className="w-full overflow-hidden rounded-lg border border-gray-300">
        <div className="flex">
          <div className="basis-[30%] p-4 flex items-center justify-center">
            <Image
              src="/img/descorchar.jpg"
              alt="Botella de vino"
              width={480}
              height={752}
              quality={85}
              className="h-auto w-full"
              sizes="480px"
              priority />
          </div>

          <div className="basis-[70%] flex flex-col">
            <div className="p-4 border-l border-gray-300">
              <header className="space-y-1">
                <h1 className="text-2xl font-bold text-center text-gray-900 font-bold italic text-4xl">! Bienvenido a DrinkWare ¡</h1>
                <p className="text-sm text-center text-gray-600">
                  Descubre lo nuevo y navega por los apartados disponibles.
                </p>
              </header>
            </div>

            <div className="flex border-t border-gray-300">
              <div className="basis-2/3 p-4 indent-8 text-justify whitespace-normal">
                ¡Bienvenido {user.nombre || user.nombreusuario}¡ Tu tienda de licores en línea donde lo importante es comprar fácil y recibir rápido. Tenemos de todo: aguardientes, rones, cervezas
                artesanales y vinos para cada ocasión.
                <div className="my-4" />
                Cada compra está cubierta por nuestra garantía de distribuidora y un equipo de soporte que te ayuda si lo necesitas.
                Haz tu pedido de forma segura, paga como prefieras y aprovecha la entrega a domicilio con tiempos cortos y seguimiento.
                <div className="my-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/productos"
                    className="block rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-500"
                  >
                    Ver nuestros productos
                  </Link>
                  <Link
                    href="/user/admin"
                    className="block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:border-sky-400 hover:text-sky-500"
                  >
                    Contactenos
                  </Link>
                </div>
              </div>
              <div className="basis-1/3 p-4">
                <Image
                  src="/img/rones.png"
                  alt="Imagen de contenido"
                  width={400}
                  height={300}
                  className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
