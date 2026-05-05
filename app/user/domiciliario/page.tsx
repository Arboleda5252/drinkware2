import { getUserFromSession } from "@/app/Datalibs/auth";
import DomiciliarioPedidos from "./DomiciliarioPedidos";

export const metadata = { title: 'Domiciliario' };

export default async function Page() {
  const user = await getUserFromSession();
  const nombre = user?.nombre ?? user?.nombreusuario ?? "Domiciliario";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/50">
        <h1 className="text-3xl font-semibold text-slate-900">Panel de entregas</h1>
        <p className="mt-3 text-sm text-slate-600">
          {user
            ? `Bienvenido ${nombre}. Aquí podrás ver y gestionar los pedidos que te han sido asignados.`
            : "Bienvenido al panel del domiciliario. Aquí podrás gestionar tus entregas y consultar tus pedidos asignados."}
        </p>
      </header>
      <DomiciliarioPedidos />
    </main>
  );
}