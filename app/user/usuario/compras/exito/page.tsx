"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ExitoCompraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<"loading" | "success" | "error">("loading");
  const [mensaje, setMensaje] = useState("Confirmando el pago con Stripe...");

  useEffect(() => {
    let cancelled = false;
    const paymentIntentId = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    const confirmPayment = async () => {
        if (!paymentIntentId) {
          if (!cancelled) {
            router.replace(
              "/user/usuario/compras/fallo?reason=" +
                encodeURIComponent("No se encontro el identificador del pago en el retorno de Stripe.")
            );
          }
          return;
        }

      try {
        const response = await fetch("/api/stripe/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });

        const payload: {
          ok: boolean;
          data?: { status?: string; estadoPago?: string };
          error?: string;
        } | null = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? `Error ${response.status}`);
        }

        if (!cancelled) {
          if (payload.data?.status === "succeeded" || payload.data?.estadoPago === "Aprobado") {
            setEstado("success");
            setMensaje("Tu pago fue confirmado correctamente.");
            return;
          }

          router.replace(
            "/user/usuario/compras/fallo?reason=" +
              encodeURIComponent(
                redirectStatus === "failed"
                  ? "Stripe reporto un fallo en el pago."
                  : "El pago no quedo aprobado. Revisa el estado en tus pedidos."
              )
          );
        }
      } catch (error) {
        if (!cancelled) {
          router.replace(
            "/user/usuario/compras/fallo?reason=" +
              encodeURIComponent(
                error instanceof Error
                  ? error.message
                  : "No se pudo validar el pago con Stripe."
              )
          );
        }
      }
    };

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

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
          {mensaje}
        </p>
        {estado === "loading" && (
          <p className="mt-2 text-lg text-gray-600">Espera un momento mientras validamos el pago.</p>
        )}
        {estado === "success" && (
          <p className="mt-2 text-lg text-gray-600">En poco tiempo tendras tus productos.</p>
        )}
        {estado === "error" && (
          <p className="mt-2 text-lg text-amber-700">
            Revisa el estado del pago antes de continuar.
          </p>
        )}
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
