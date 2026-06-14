import Link from "next/link";
import Image from "next/image";
import { getUserFromSession } from "@/app/Datalibs/auth";
import NavMenu from "./nav-menu";

export default async function Nav() {
  const user = await getUserFromSession();
  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-[60] bg-black/95 px-3 py-3 text-white shadow-lg backdrop-blur sm:px-4">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 sm:h-16">
          <Link href={user ? "/user" : "/"} className="inline-flex shrink-0 items-center">
            <Image
              src="/Logos/Logo2Drink.png"
              alt="Logo"
              width={100}
              height={60}
              className="h-auto w-24 align-middle sm:w-[100px]"
            />
          </Link>

          <NavMenu isLoggedIn={Boolean(user)} />
        </div>
      </nav>
      <div aria-hidden="true" className="h-20 bg-black sm:h-24" />
    </>
  );
}
