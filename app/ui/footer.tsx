import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white text-center flex flex-col space-y-1 mx-2">
      <div className="text-xs text-neutral-300 flex flex-nowrap justify-center space-x-4 py-1">
              <div className="mx-4"><Link href="pqrs/nosotros" className="hover:text-sky-400">Sobre nosotros</Link></div>
              <div className="mx-4"><Link href="pqrs/marcas" className="hover:text-sky-400">Marcas representadas</Link></div>
          </div>
      <div className="bg-black text-xs text-neutral-300 px-4 py-1 text-center">
        Prohíbase el expendio de bebidas embriagantes a menores de edad. El exceso de alcohol es perjudicial para la salud.
      </div>
      <p>&copy; 2026 DrinkWare. Todos los derechos reservados.</p>
    </footer>
  );
}
