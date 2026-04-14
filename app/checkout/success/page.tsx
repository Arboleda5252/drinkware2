export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
          Pago recibido
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">
          Tu pago fue procesado correctamente
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Puedes cerrar esta pagina. La tienda recibira la confirmacion del pago por webhook.
        </p>
      </div>
    </main>
  );
}
