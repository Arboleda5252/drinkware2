"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SuccessClientProps = {
  entrega: string | null;
  metodo: string | null;
  retiro: string | null;
  paymentIntentId: string | null;
  redirectStatus: string | null;
  total: number | null;
};

type EstadoVista = "loading" | "success";

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const normalizarEntrega = (entrega: string | null) =>
  entrega === "Retiro_tienda" ? "Retiro_tienda" : "Domicilio";

const normalizarMetodo = (metodo: string | null) => {
  if (metodo === "Tarjeta" || metodo === "Contraentrega" || metodo === "Efectivo") {
    return metodo;
  }
  return null;
};

export default function ExitoCompraClient({
  entrega,
  metodo,
  retiro,
  paymentIntentId,
  redirectStatus,
  total,
}: SuccessClientProps) {
  const router = useRouter();
  const entregaNormalizada = normalizarEntrega(entrega);
  const metodoInicial = normalizarMetodo(metodo);
  const [estado, setEstado] = useState<EstadoVista>(paymentIntentId ? "loading" : "success");
  const [mensajePago, setMensajePago] = useState(
    paymentIntentId ? "Confirmando el pago con tarjeta..." : ""
  );

  useEffect(() => {
    let cancelled = false;

    const confirmPayment = async () => {
      if (!paymentIntentId) {
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

        if (cancelled) {
          return;
        }

        if (payload.data?.status === "succeeded" || payload.data?.estadoPago === "Pagado") {
          setEstado("success");
          setMensajePago("Tu compra ha sido pagada.");
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
  }, [paymentIntentId, redirectStatus, router]);

  const detalleEntrega = useMemo(() => {
    if (entregaNormalizada === "Domicilio") {
      return "En breve estara en tu casa.";
    }

    return retiro
      ? `Tu pedido y los productos han sido separados. Por favor ve en la fecha especificada: ${new Date(
          retiro
        ).toLocaleString("es-CO")}.`
      : "Tu pedido y los productos han sido separados. Por favor ve en la fecha especificada.";
  }, [entregaNormalizada, retiro]);

  const detallePago = useMemo(() => {
    if (paymentIntentId) {
      return mensajePago;
    }

    if (metodoInicial === "Contraentrega") {
      return "Por favor pagar cuando llegue el producto.";
    }

    if (metodoInicial === "Efectivo") {
      return "Tienes 7 dias para recoger el producto y pagar en la tienda.";
    }

    if (metodoInicial === "Tarjeta") {
      return "Tu compra ha sido pagada.";
    }

    return "";
  }, [mensajePago, metodoInicial, paymentIntentId]);

  return (
<main className="min-h-screen bg-zinc-950 px-4 py-12 antialiased">
  <div className="mx-auto max-w-3xl rounded-3xl bg-zinc-900 p-8 shadow-2xl ring-1 ring-white/10 sm:p-12">
    <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
      Pedido confirmado
    </p>
    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-50">
      Tu pedido ha sido confirmado
    </h1>
    <p className="mt-4 text-lg text-zinc-400">{detalleEntrega}</p>
    {detallePago ? <p className="mt-2 text-lg text-zinc-400">{detallePago}</p> : null}
    
    {estado === "loading" ? (
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
          Espera un momento mientras validamos el pago.
        </button>
      </div>
    ) : null}

    <div className="mt-8 grid gap-4 rounded-2xl bg-zinc-850 border border-zinc-800 p-6 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Valor de la compra</p>
        <p className="mt-1 text-xl font-bold text-amber-400">
          {total !== null ? formatoCOP.format(total) : "No disponible"}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Entrega</p>
        <p className="mt-1 text-base font-semibold text-zinc-200">
          {entregaNormalizada === "Domicilio" ? "Domicilio" : "Retiro en tienda"}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Método de pago</p>
        <p className="mt-1 text-base font-semibold text-zinc-200">
          {metodoInicial === "Efectivo"
            ? "Efectivo en tienda"
            : metodoInicial ?? "No disponible"}
        </p>
      </div>
    </div>

    <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
      <Link
        href="/productos"
        className="rounded-xl bg-zinc-50 px-6 py-3 text-center text-sm font-bold text-zinc-950 transition duration-200 hover:bg-zinc-200 active:scale-[0.98]"
      >
        Ver más productos
      </Link>
      <Link
        href="/user/usuario/seguimiento"
        className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-zinc-300 transition duration-200 hover:bg-zinc-800 hover:text-zinc-100 active:scale-[0.98]"
      >
        Ver mis pedidos
      </Link>
    </div>
  </div>
</main>
  );
}
