import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black px-4 py-6 text-center text-white">
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 py-2 text-xs text-neutral-300">
        <Link href="/pqrs/nosotros" className="hover:text-sky-400">
          Sobre nosotros
        </Link>
        <Link href="/pqrs/marcas" className="hover:text-sky-400">
          Marcas representadas
        </Link>
      </div>

      <div className="px-4 py-3 text-center text-xs text-neutral-300">
        Prohibase el expendio de bebidas embriagantes a menores de edad. El
        exceso de alcohol es perjudicial para la salud.
      </div>

      <p className="pt-2 text-sm text-white">
        &copy; 2026 DrinkWare. Todos los derechos reservados.
      </p>
    </footer>
  );
}
