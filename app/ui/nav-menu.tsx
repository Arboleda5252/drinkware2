"use client";

import * as React from "react";
import Link from "next/link";
import { AiFillProduct } from "react-icons/ai";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import { MdOutlineLiveHelp } from "react-icons/md";
import LogoutButton from "./logout-button";

type NavMenuProps = {
  isLoggedIn: boolean;
};

export default function NavMenu({ isLoggedIn }: NavMenuProps) {
  const [open, setOpen] = React.useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <div className="relative flex items-center justify-end">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white shadow-lg ring-1 ring-white/15 transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300 sm:hidden"
        aria-label={open ? "Cerrar menu" : "Abrir menu"}
        aria-expanded={open}
      >
        {open ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
      </button>

      <div
        className={`absolute right-0 top-14 w-[min(82vw,280px)] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 p-2 text-white shadow-2xl backdrop-blur-md transition sm:static sm:flex sm:w-auto sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:opacity-100"
        }`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/pqrs/contactenos"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/10 hover:text-sky-400 sm:flex-col sm:gap-1 sm:px-2 sm:py-1 sm:text-center"
          >
            <MdOutlineLiveHelp className="text-2xl sm:text-4xl" />
            <span>Contactenos</span>
          </Link>

          <Link
            href="/productos"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/10 hover:text-sky-400 sm:flex-col sm:gap-1 sm:px-2 sm:py-1 sm:text-center"
          >
            <AiFillProduct className="text-2xl sm:text-4xl" />
            <span>Productos</span>
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/10 hover:text-sky-400 sm:flex-col sm:gap-1 sm:px-2 sm:py-1 sm:text-center">
              <LogoutButton />
              <span>Cerrar Sesion</span>
            </div>
          ) : (
            <Link
              href="/user_account"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/10 hover:text-sky-400 sm:flex-col sm:gap-1 sm:px-2 sm:py-1 sm:text-center"
            >
              <FaUser className="text-2xl sm:text-4xl" />
              <span>Mi cuenta</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
