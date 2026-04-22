"use client";

import { useMemo, useState } from "react";

type PaymentLinkModalProps = {
  pedidoId: number;
  pagoId: number;
  cliente: string;
  total: number;
  checkoutUrl: string;
  onClose: () => void;
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function PaymentLinkModal({
  pedidoId,
  pagoId,
  cliente,
  total,
  checkoutUrl,
  onClose,
}: PaymentLinkModalProps) {
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");

  const emailHref = useMemo(() => {
    const subject = encodeURIComponent(`Link de pago pedido #${pedidoId}`);
    const body = encodeURIComponent(
      [
        `Hola ${cliente || "cliente"},`,
        "",
        `Comparte este link para completar el pago de tu pedido #${pedidoId}:`,
        checkoutUrl,
        "",
        `Valor: ${formatoCOP.format(total)}`,
      ].join("\n")
    );

    return `mailto:?subject=${subject}&body=${body}`;
  }, [checkoutUrl, cliente, pedidoId, total]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
              Link de pago
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              Pedido #{pedidoId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            X
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Total</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {formatoCOP.format(total)}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">URL de Stripe</p>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all text-sm text-sky-700 underline underline-offset-2"
          >
            {checkoutUrl}
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Copiar link
          </button>
        </div>
      </div>
    </div>
  );
}
