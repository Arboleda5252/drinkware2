"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function FalloCompraPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 antialiased">
      <div className="mx-auto max-w-3xl rounded-3xl bg-zinc-900 p-8 shadow-2xl ring-1 ring-white/10 sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-400">
          Pago no completado
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-50">
          Tu pago no pudo completarse
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          La transaccion fue cancelada o quedo pendiente de confirmacion.
        </p>
        <div className="mt-6 flex justify-start">
          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/10"
          >
            <svg
              className="mr-3 size-5 animate-spin text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Actualizando el estado final del intento de pago.
          </button>
        </div>
        {reason && (
          <p className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {reason}
          </p>
        )}
        <p className="mt-4 text-lg text-zinc-400">
          Puedes intentarlo de nuevo o seguir viendo productos.
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Estado</p>
            <p className="mt-1 text-base font-semibold text-rose-300">Pago rechazado o cancelado</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Siguiente paso</p>
            <p className="mt-1 text-base font-semibold text-zinc-200">Reintentar la compra</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Accion recomendada</p>
            <p className="mt-1 text-base font-semibold text-zinc-200">Revisar medio de pago</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/user/usuario/compras"
            className="rounded-xl bg-zinc-50 px-6 py-3 text-center text-sm font-bold text-zinc-950 transition duration-200 hover:bg-zinc-200 active:scale-[0.98]"
          >
            Volver al carrito
          </Link>
          <Link
            href="/productos"
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-zinc-300 transition duration-200 hover:bg-zinc-800 hover:text-zinc-100 active:scale-[0.98]"
          >
            Ver mas productos
          </Link>
        </div>
      </div>
    </main>
  );
}
