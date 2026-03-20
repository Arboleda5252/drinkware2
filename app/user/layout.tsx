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

  return (
    <div className="flex min-h-screen flex-col bg-gray-10 md:flex-row">
      <aside className="w-full bg-white shadow-lg md:w-72">
        <div className="flex h-full flex-col px-1 py-4 md:px-4">
          <Link className="mb-4 flex h-14 items-center justify-center rounded-md bg-blue-500 p-1 md:h-40" href="/user">
            <div className="flex w-full flex-col items-center justify-center text-white">
              <Image
                src="/Logos/LogoAdmin.png"
                alt="Logo usuario"
                width={60}
                height={60}
                className="w-full max-w-[60px] brightness-0 invert"
              />
              <p className="text-lg font-semibold md:text-2xl">{displayName}</p>
            </div>
          </Link>

          <div className="rounded-md bg-gray-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-800">{displayRole}</p>
          </div>

          <div className="mt-4 flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
            <nav className="flex w-full flex-col space-y-2">
              {menuLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center rounded-md px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-900 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block" />
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

// Link por rol de usuario
function Link_Roles(roleId: number | null | undefined): MenuLink[] {
  const defaultLinks: MenuLink[] = [
    { href: "/user/usuario", label: "Mi cuenta" },
    { href: "/user/usuario/compras", label: "Mis compras" },
  ];

  switch (roleId) {
    case 2:
      return [
        ...defaultLinks,
        { href: "/user/admin/alertas", label: "Notificaciones" },
        { href: "/user/admin", label: "Gestión de usuarios" },
        { href: "/user/admin/products", label: "Gestión de productos" },
        { href: "/user/admin/repVentas", label: "Reporte de Ventas" },
      ];
    case 3:
      return [
        ...defaultLinks,
        { href: "/user/vendedor", label: "Gestión de ventas" },
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
