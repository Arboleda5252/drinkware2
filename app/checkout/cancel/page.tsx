import Image from "next/image";

export default function CheckoutCancelPage() {
  return (
    <main className="bg-black text-white">
      <section className="relative min-h-screen overflow-hidden rounded-b-[2.5rem] bg-[#0b1220] shadow-2xl">
        <div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

          <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-16">
            <div className="relative order-2 mx-auto flex min-h-[420px] w-full max-w-[520px] items-center justify-center lg:order-1">
              <div className="absolute left-4 top-10 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl" />
              <div className="absolute bottom-8 right-10 h-24 w-24 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex w-full items-center justify-center rounded-[2rem] border border-white/15 bg-white/5 px-6 py-10 shadow-[0_25px_60px_rgba(0,0,0,0.38)]">
                <Image
                  src="/img/agts.png"
                  alt="Imagen de agradecimiento"
                  priority
                  width={404}
                  height={293}
                  className="relative z-10 h-auto w-full max-w-[404px] drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 via-transparent to-slate-950/30" />
              </div>
            </div>

            <div className="order-1 w-full lg:order-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8 md:p-10">
                <p className="text-sm text-centerfont-semibold uppercase tracking-[0.25em] text-emerald-300">
                  Pago cancelado
                </p>
                <p className="mt-6 text-base leading-8 text-white/85 sm:text-lg">
                  Tu pago fue cancelado y tu pedido no se procesará.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
