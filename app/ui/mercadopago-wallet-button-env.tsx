import MercadoPagoWalletButton from "@/app/ui/mercadopago-wallet-button";

const DEFAULT_MERCADOPAGO_PUBLIC_KEY = "TEST-b9f4500f-51f6-4a70-bcf1-4c2b74fc255e";

type MercadoPagoWalletButtonEnvProps = {
  preferenceId?: string | null;
  title?: string;
  description?: string;
};

export default function MercadoPagoWalletButtonEnv({
  preferenceId,
  title,
  description,
}: MercadoPagoWalletButtonEnvProps) {
  const publicKey =
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ??
    process.env.YOUR_PUBLIC_KEY ??
    DEFAULT_MERCADOPAGO_PUBLIC_KEY;

  const resolvedPreferenceId = preferenceId ?? "";

  if (!publicKey) {
    return (
      <p className="text-sm text-rose-600">
        Falta configurar la Public Key de Mercado Pago en .env
      </p>
    );
  }

  if (!resolvedPreferenceId) {
    return (
      <p className="text-sm text-rose-600">
        Falta configurar el Preference ID de Mercado Pago en .env
      </p>
    );
  }

  return (
    <MercadoPagoWalletButton
      publicKey={publicKey}
      preferenceId={resolvedPreferenceId}
      title={title}
      description={description}
    />
  );
}
