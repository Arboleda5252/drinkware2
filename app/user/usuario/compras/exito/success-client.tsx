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
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Pedido confirmado
        </p>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">
          Tu pedido ha sido confirmado
        </h1>
        <p className="mt-4 text-lg text-gray-600">{detalleEntrega}</p>
        {detallePago ? <p className="mt-2 text-lg text-gray-600">{detallePago}</p> : null}
        {estado === "loading" ? (
          <p className="mt-2 text-sm font-medium text-sky-700">
            Espera un momento mientras validamos el pago.
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-gray-500">Valor de la compra</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {total !== null ? formatoCOP.format(total) : "No disponible"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Entrega</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {entregaNormalizada === "Domicilio" ? "Domicilio" : "Retiro en tienda"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Metodo de pago</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {metodoInicial === "Efectivo"
                ? "Efectivo en tienda"
                : metodoInicial ?? "No disponible"}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/productos"
            className="rounded-xl bg-sky-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Ver mas productos
          </Link>
          <Link
            href="/user/usuario/seguimiento"
            className="rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}
