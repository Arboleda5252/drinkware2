"use client";

import * as React from "react";

type FormState = {
  nombre: string;
  correo: string;
  mensaje: string;
};

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
      // Envía a tu endpoint (ajusta la URL)
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false)
        throw new Error(json?.error ?? `HTTP ${res.status}`);

      setOk("¡Mensaje enviado correctamente!");
      setForm({ nombre: "", correo: "", mensaje: "" });
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  return (
   <main className="bg-gray-100 font-sans">
      

      {/* Encabezado */}
      <header className="bg-gradient-to-r from-purple-700 to-pink-600 text-white py-16 text-center shadow-lg mt-20">
        <h1 className="text-5xl font-extrabold tracking-wide">
          Contáctenos
        </h1>
        <p className="mt-3 text-xl">
          Estamos aquí para atenderte y resolver tus dudas
        </p>
      </header>

      {/* Formulario de contacto */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        {/* Información de contacto */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 text-center">
            Información de contacto
          </h2>
          <p className="mt-4 text-gray-700 text-lg">
            Puedes comunicarte con nosotros a través de los siguientes medios:
          </p>
          <ul className="mt-6 space-y-4 text-gray-700 text-lg">
            <li>
              📍 Dirección: Calle 123 #45-67, Medellín, Colombia
            </li>
            <li>📞 Teléfono: +57 300 123 4567</li>
            <li>✉️ Correo: contacto@drinkware.com</li>
            <li>🕒 Horarios: Lunes a Sábado, 9:00am - 8:00pm</li>
          </ul>
        </div>

        {/* Formulario */}
            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-purple-700 text-center">
        Escríbenos
      </h2>

      <div className="mt-6 space-y-4">
        <input
          name="nombre"
          type="text"
          placeholder="Tu nombre"
          value={form.nombre}
          onChange={onChange}
          required
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <input
          name="correo"
          type="email"
          placeholder="Tu correo"
          value={form.correo}
          onChange={onChange}
          required
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <textarea
          name="mensaje"
          placeholder="Tu mensaje"
          rows={5}
          value={form.mensaje}
          onChange={onChange}
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar mensaje"}
        </button>

        {ok && <p className="text-green-600 text-sm">{ok}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </form>
      </section>

    </main>
  );
}
