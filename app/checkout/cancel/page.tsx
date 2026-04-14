export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Pago cancelado
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">
          El pago no se completo
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Si necesitas continuar, solicita nuevamente el link de pago al vendedor.
        </p>
      </div>
    </main>
  );
}
