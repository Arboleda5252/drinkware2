import Image from "next/image";

export default function CheckoutSuccessPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-12">
      <div className="absolute inset-y-0 right-0 w-full md:w-[62vw]">
        <Image
          src="/img/agts.png"
          alt="Imagen de agradecimiento"
          fill
          priority
          sizes="100vw"
          className="object-contain object-right opacity-90"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/25" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
        <div className="max-w-2xl rounded-3xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-black/5 backdrop-blur-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
            Pago recibido
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            Muchas gracias por elegirnos
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Tu pago fue procesado correctamente.
          </p>
        </div>
      </div>
    </main>
  );
}
