"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function FalloCompraPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-600">
          Pago no completado
        </p>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">
          Tu pago no pudo completarse
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          La transaccion fue cancelada o quedo pendiente de confirmacion.
        </p>
        {reason && (
          <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {reason}
          </p>
        )}
        <p className="mt-2 text-lg text-gray-600">
          Puedes intentarlo de nuevo o seguir viendo productos.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/user/usuario/compras"
            className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Volver al carrito
          </Link>
          <Link
            href="/productos"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Ver mas productos
          </Link>
        </div>
      </div>
    </main>
  );
}
