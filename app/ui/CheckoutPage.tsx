"use client";

import { FormEvent, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

type CheckoutPageProps = {
  amount: number;
};

export default function CheckoutPage({ amount }: CheckoutPageProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user/usuario/compras/exito`,
      },
    });

    if (error) {
      const message = error.message ?? "No se pudo procesar el pago con Stripe.";
      setErrorMessage(message);
      router.push(
        `/user/usuario/compras/fallo?reason=${encodeURIComponent(message)}`
      );
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-xl border border-indigo-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-indigo-900">Checkout de Stripe</p>
      <p className="mt-1 text-sm text-indigo-700">
        El pago se esta preparando con Stripe en pesos colombianos.
      </p>
      <div className="mt-4 rounded-lg bg-indigo-50 p-3">
        <p className="text-sm text-gray-700">
          Valor capturado para Stripe:{" "}
          <strong>{amount.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</strong>
        </p>
      </div>
      <div className="mt-4">
        <PaymentElement />
      </div>
      {errorMessage && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Procesando..." : `Pagar ${amount.toLocaleString("es-CO", { style: "currency", currency: "COP" })}`}
      </button>
    </form>
  );
}
