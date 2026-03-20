export default function Page() {
  return (
     <main className="bg-gray-100 font-sans">
      {/* Encabezado */}
      <header className="bg-gradient-to-r from-purple-700 to-pink-600 text-white py-16 text-center shadow-lg mt-20">
        <h1 className="text-5xl font-extrabold tracking-wide">Sobre Nosotros</h1>
        <p className="mt-3 text-xl">
          Conoce más acerca de nuestra historia, misión y visión
        </p>
      </header>

      {/* Contenido */}
      <section className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {/* Quiénes somos */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 text-center">
            ¿Quiénes somos?
          </h2>
          <p className="mt-4 text-gray-700 text-lg text-center">
            En <span className="font-bold">DrinkWare</span> somos una distribuidora de licores colombianos que
            busca resaltar nuestra tradición y cultura a través de productos de
            calidad. Nos enfocamos en brindar experiencias únicas, fomentando el
            consumo responsable y promoviendo el talento de productores
            nacionales.
          </p>
        </div>

        {/* Misión */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 text-center">
            Nuestra Misión
          </h2>
          <p className="mt-4 text-gray-700 text-lg text-center">
            Ofrecer a nuestros clientes una amplia variedad de licores
            colombianos de alta calidad, asegurando un servicio cercano,
            confiable y responsable que genere experiencias memorables y
            contribuya al desarrollo de la industria nacional.
          </p>
        </div>

        {/* Visión */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 text-center">
            Nuestra Visión
          </h2>
          <p className="mt-4 text-gray-700 text-lg text-center">
            Para el año 2030 ser reconocidos como la distribuidora de licores
            líder en Colombia, destacándonos por la calidad de nuestros
            productos, la innovación en nuestros procesos y el compromiso con
            nuestros clientes y la cultura del país.
          </p>
        </div>

        {/* Valor agregado */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 text-center">
            Nuestro Valor Agregado
          </h2>
          <ul className="mt-6 space-y-3 text-lg text-gray-700 list-disc list-inside">
            <li>Promovemos el consumo responsable y consciente.</li>
            <li>Apoyamos a productores locales y marcas nacionales.</li>
            <li>Garantizamos autenticidad y calidad en cada producto.</li>
            <li>
              Brindamos una experiencia de compra moderna, ágil y confiable.
            </li>
            <li>
              Creamos comunidad alrededor de la cultura del licor colombiano.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}