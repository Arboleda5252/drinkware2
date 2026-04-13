import ExitoCompraClient from "./success-client";

type SearchParamsValue = string | string[] | undefined;

type ExitoPageProps = {
  searchParams: Promise<Record<string, SearchParamsValue>>;
};

const readParam = (value: SearchParamsValue) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export default async function ExitoCompraPage({ searchParams }: ExitoPageProps) {
  const params = await searchParams;
  const totalValue = Number(readParam(params.total));

  return (
    <ExitoCompraClient
      entrega={readParam(params.entrega)}
      metodo={readParam(params.metodo)}
      retiro={readParam(params.retiro)}
      paymentIntentId={readParam(params.payment_intent)}
      redirectStatus={readParam(params.redirect_status)}
      total={Number.isFinite(totalValue) ? totalValue : null}
    />
  );
}
