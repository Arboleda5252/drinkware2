
import Link from "next/link";

export default function Page() {
  return (
    <div>
      <div className="absolute inset-0 bg-[url(/img/vino.jpg)] bg-cover bg-center opacity-30 -z-10"></div>
      <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
        <section className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

            <h1 className="text-2xl font-bold tracking-tight">Bienvenido a DrinkWare</h1>
            <p className="text-sm text-gray-500 mt-1">Elige una opción para continuar</p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/account/login"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium shadow-sm ring-1 ring-gray-200 hover:bg-sky-300"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/account/registro"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:shadow-lg bg-gray-200 hover:bg-sky-300"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}