"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombreusuario: username, password }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        router.push("/user");
        if (typeof (router as any).refresh === "function") {
          (router as any).refresh();
        } else if (typeof globalThis !== "undefined" && globalThis.location) {
          globalThis.location.reload();
        }
      } else {
        alert(json.error || "Credenciales incorrectas");
      }
    } catch (err) {
      alert("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[url(/img/vino.jpg)] bg-cover bg-center opacity-30 -z-10"></div>
      <main className="relative min-h-screen flex items-center justify-center p-6">
        <section className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Usuario"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-sky-500 transition shadow-sm disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <div className="mt-4 text-center text-gray-600">
            <Link href="/account/registro" className="text-sky-900 hover:underline font-semibold">
              Regístrate aquí
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
