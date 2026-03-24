"use client";

import Link from "next/link";

export default function ExitoCompraPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Compra exitosa
        </p>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">
          Tu compra fue exitosa
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          En poco tiempo tendras tus productos.
        </p>
        <p className="mt-2 text-lg text-gray-600">
          Aun puedes ver mas productos.
        </p>
        <p className="mt-8 text-xl font-semibold text-gray-900">
          Muchas gracias por elegirnos
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/productos"
            className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Ver mas productos
          </Link>
          <Link
            href="/user/usuario/seguimiento"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}
