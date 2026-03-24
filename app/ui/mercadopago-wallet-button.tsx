"use client";

import { useEffect } from "react";
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";

type MercadoPagoWalletButtonProps = {
  publicKey: string;
  preferenceId: string;
  title?: string;
  description?: string;
};

export default function MercadoPagoWalletButton({
  publicKey,
  preferenceId,
  title = "Boton de pago",
  description = "Haz clic en el boton para realizar el pago.",
}: MercadoPagoWalletButtonProps) {
  useEffect(() => {
    initMercadoPago(publicKey);
  }, [publicKey]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-center text-sm text-gray-600">{description}</p>
      <div className="mt-6 w-full max-w-[320px]">
        <Wallet initialization={{ preferenceId }} />
      </div>
    </div>
  );
}
