"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

type MenuLink = {
  href: string;
  label: string;
  badgeCount?: number;
};

type UserMobileMenuProps = {
  displayName: string;
  displayRole: string;
  roleLogo: string;
  menuLinks: MenuLink[];
};

export default function UserMobileMenu({
  displayName,
  displayRole,
  roleLogo,
  menuLinks,
}: UserMobileMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 bg-slate-950/90 px-3 py-2 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/user" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10">
            <Image
              src={roleLogo}
              alt="Logo usuario"
              width={36}
              height={36}
              className="h-6 w-6 object-contain brightness-0 invert"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight text-white">
              {displayName}
            </span>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
              {displayRole}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="mobile-user-menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition hover:border-sky-300/30 hover:bg-white/15"
        >
          {isOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          <span className="sr-only">Abrir menu</span>
        </button>
      </div>

      {isOpen ? (
        <nav id="mobile-user-menu" className="mt-2 grid gap-1.5 pb-1">
          {menuLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={[
                  "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-sky-400/15 text-white ring-1 ring-sky-300/25"
                    : "bg-white/[0.06] text-white/80 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="truncate">{link.label}</span>
                {typeof link.badgeCount === "number" ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                    {link.badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
