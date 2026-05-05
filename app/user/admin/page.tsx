import Link from "next/link";

const adminOptions = [
  {
    href: "/user/admin/gestionDomiciliario",
    eyebrow: "Operaciones",
    title: "Gestión de entregas",
    description:
      "Consulta pedidos, asigna domiciliarios y supervisa el estado de cada despacho en tiempo real.",
  },
  {
    href: "/user/admin/gestionVendedor",
    eyebrow: "Comercial",
    title: "Gestión de Vendedores",
    description:
      "Administra vendedores, permisos de acceso y supervisa su desempeño en la plataforma.",
  },
  {
    href: "/user/admin/gestionUsers",
    eyebrow: "Usuarios",
    title: "Gestión de usuarios",
    description:
      "Consulta el directorio de usuarios, filtra por rol y actualiza permisos de acceso al sistema.",
  },
];

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">Panel administrativo</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Centro de gestion
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
          Consulta usuarios, gestiona roles y actualiza permisos de acceso al sistema.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {adminOptions.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="group flex min-h-[240px] flex-col justify-between rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-sky-300/40 hover:bg-white/15"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/90">
                {option.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-bold text-white">{option.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">{option.description}</p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-sm font-semibold text-white">
              <span>Ir al modulo</span>
              <span className="transition group-hover:translate-x-1">{">"}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
