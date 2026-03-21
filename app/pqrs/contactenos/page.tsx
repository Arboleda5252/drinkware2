"use client";

import * as React from "react";

type FormState = {
  nombre: string;
  correo: string;
  mensaje: string;
};

const contactItems = [
  {
    title: "Direccion",
    value: "Calle 123 #45-67, Medellin, Colombia",
  },
  {
    title: "Telefono",
    value: "+57 300 123 4567",
  },
  {
    title: "Correo",
    value: "contacto@drinkware.com",
  },
  {
    title: "Horario",
    value: "Lunes a Sabado, 9:00 a.m. - 8:00 p.m.",
  },
];

export default function Page() {
  const [form, setForm] = React.useState<FormState>({
    nombre: "",
    correo: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = React.useState(false);
  const [ok, setOk] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setOk(null);
    setError(null);

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      setOk("Mensaje enviado correctamente.");
      setForm({ nombre: "", correo: "", mensaje: "" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
      setError(message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-[#0b1220] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-5 text-4xl font-extrabold uppercase tracking-[0.14em] text-white sm:text-5xl md:text-6xl">
              Contáctenos
            </h1>
            <p className="mt-6 text-base leading-8 text-white/80 sm:text-lg">
              Resolvemos dudas, recibimos solicitudes y te acompanamos durante
              tu compra con una atencion cercana, rapida y clara.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Informacion de contacto
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">
                Puedes escribirnos para soporte, pedidos, horarios, marcas o
                cualquier consulta relacionada con Drinkware.
              </p>

              <div className="mt-8 grid gap-4">
                {contactItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/10 px-5 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/85 sm:text-base">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8"
            >
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Escribenos
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">
                Completa el formulario y te responderemos lo antes posible.
              </p>

              <div className="mt-8 space-y-4">
                <input
                  name="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChange={onChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-white/35 focus:border-sky-300/40 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />

                <input
                  name="correo"
                  type="email"
                  placeholder="Tu correo"
                  value={form.correo}
                  onChange={onChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-white/35 focus:border-sky-300/40 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />

                <textarea
                  name="mensaje"
                  placeholder="Tu mensaje"
                  rows={6}
                  value={form.mensaje}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-white/35 focus:border-sky-300/40 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />

                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex w-full items-center justify-center rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:scale-[1.01] hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar mensaje"}
                </button>

                {ok && <p className="text-sm text-emerald-300">{ok}</p>}
                {error && <p className="text-sm text-rose-300">{error}</p>}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
