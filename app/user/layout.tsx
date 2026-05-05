import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getUserFromSession } from "@/app/Datalibs/auth";

type UserLayoutProps = {
  children: ReactNode;
};

type MenuLink = {
  href: string;
  label: string;
};

export default async function UserLayout({ children }: UserLayoutProps) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/account/login");
  }

  const displayName = user.nombre || user.nombreusuario;
  const displayRole = user.rol ?? "Usuario";
  const menuLinks = Link_Roles(user.id_rol);
  const roleLogo = getRoleLogo(user.id_rol);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md md:w-72 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col px-3 py-4 md:px-4">
          <Link
            className="mb-4 flex h-20 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 md:h-44"
            href="/user"
          >
            <div className="flex w-full flex-col items-center justify-center text-white">
              <Image
                src={roleLogo}
                alt="Logo usuario"
                width={60}
                height={60}
                className="w-full max-w-[60px] brightness-0 invert"
              />
              <p className="mt-3 text-lg font-semibold md:text-2xl">{displayName}</p>
            </div>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-200">{displayRole}</p>
          </div>

          <div className="mt-4 flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
            <nav className="flex w-full flex-col space-y-2">
              {menuLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center rounded-xl border border-white/10 bg-gray-200/12 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-sky-300/30 hover:bg-gray-300/18 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function getRoleLogo(roleId: number | null | undefined) {
  switch (roleId) {
    case 2:
      return "/Logos/Logo2.png";
    case 3:
      return "/Logos/Logo3.png";
    case 4:
      return "/Logos/Logo4.png";
    case 5:
      return "/Logos/Logo5.png";
    default:
      return "/Logos/Logo1.png";
  }
}

// Link por rol de usuario
function Link_Roles(roleId: number | null | undefined): MenuLink[] {
  const defaultLinks: MenuLink[] = [
    { href: "/user/usuario", label: "Mi cuenta" },
    { href: "/user/usuario/compras", label: "Mis compras" },
    { href: "/user/usuario/seguimiento", label: "Mis pedidos" },
  ];

  switch (roleId) {
    case 2:
      return [
        ...defaultLinks,
        { href: "/user/admin/alertas", label: "Notificaciones" },
        { href: "/user/admin", label: "Gestión de usuarios" },
        { href: "/user/admin/products", label: "Gestión de productos" },
        { href: "/user/vendedor", label: "Gestión de Ventas" },
      ];
    case 3:
      return [
        ...defaultLinks,
        { href: "/user/vendedor", label: "Gestión de Ventas" },
        { href: "/user/vendedor/pedidos", label: "Gestión de Pedidos" },
      ];
    case 4:
      return [
      ...defaultLinks,
      { href: "/user/domiciliario", label: "Gestión de Entregas" },
      { href: "/user/domiciliario/HistorialEntregas", label: "Mis entregas" },
    ];
    case 5:
      return [
        ...defaultLinks,
        { href: "/user/proveedor", label: "Agregar producto" },
        { href: "/user/proveedor/pedidos", label: "Gestion de pedidos" },
      ];
    default:
      return defaultLinks;
  }
}
