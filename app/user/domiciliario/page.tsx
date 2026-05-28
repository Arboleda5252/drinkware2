import { getUserFromSession } from "@/app/Datalibs/auth";
import DomiciliarioPedidos from "./DomiciliarioPedidos";

export const metadata = { title: "Domiciliario" };

export default async function Page() {
  const user = await getUserFromSession();
  const nombre = user?.nombre ?? user?.nombreusuario ?? "Domiciliario";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#c9a55c]/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,41,59,0.92))] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] sm:p-10">
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#c9a55c]/16 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-sky-400/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_22%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.18),transparent_24%)]" />

        <div className="relative z-10">
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Panel de entregas
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {user
              ? `Bienvenido ${nombre}. Aqui podras ver y gestionar los pedidos que te han sido asignados.`
              : "Bienvenido al panel del domiciliario. Aqui podras gestionar tus entregas y consultar tus pedidos asignados."}
          </p>
        </div>
      </header>

      <DomiciliarioPedidos currentUserId={user?.idusuario ?? null} />
    </main>
  );
}
