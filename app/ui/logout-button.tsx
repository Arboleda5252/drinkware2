'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { CiPower } from "react-icons/ci";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo cerrar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="mt-1 flex items-center justify-center rounded-lg border border-white/40 px-2 py-1 text-sm transition disabled:opacity-60 "
        aria-label={loading ? "Saliendo..." : "Cerrar sesión"}
        title={loading ? "Saliendo..." : "Cerrar sesión"}
      >
        <CiPower className="text-3xl text-center hover:text-sky-400 hover:border-sky-400" />
      </button>
    </div>
  );
}