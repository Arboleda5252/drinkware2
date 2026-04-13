"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutPage from "@/app/ui/CheckoutPage";

if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY === undefined) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not defined");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

type StripeCheckoutContainerProps = {
  amount: number;
  idCliente?: number | null;
  idPedidos?: number[];
  tipoEntrega?: string | null;
  fechaHoraRetiro?: string | null;
};

export default function StripeCheckoutContainer({
  amount,
  idCliente,
  idPedidos = [],
  tipoEntrega,
  fechaHoraRetiro,
}: StripeCheckoutContainerProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const createPaymentIntent = async () => {
      setErrorMessage("");
      setClientSecret("");

      try {
        const response = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            idCliente,
            idPedidos,
            tipoEntrega,
          }),
        });

        const payload: {
          ok: boolean;
          data?: { clientSecret?: string | null };
          error?: string;
        } | null = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok || !payload.data?.clientSecret) {
          throw new Error(payload?.error ?? `Error ${response.status}`);
        }

        if (!cancelled) {
          setClientSecret(payload.data.clientSecret);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "No se pudo preparar el pago con Stripe"
          );
        }
      }
    };

    if (amount > 0) {
      void createPaymentIntent();
    }

    return () => {
      cancelled = true;
    };
  }, [amount, idCliente, idPedidos, tipoEntrega]);

  if (errorMessage) {
    return (
      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {errorMessage}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4 text-sm text-indigo-700">
        Preparando formulario de pago...
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
      }}
    >
      <CheckoutPage
        amount={amount}
        tipoEntrega={tipoEntrega}
        fechaHoraRetiro={fechaHoraRetiro}
      />
    </Elements>
  );
}
