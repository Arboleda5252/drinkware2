type Producto = {
  marca: string;
  alcohol: string;
  descripcion: string;
};

type Categoria = {
  categoria: string;
  items: Producto[];
};

const marcasRepresentadas: Categoria[] = [
  {
    categoria: "Aguardiente",
    items: [
      {
        marca: "Aguardiente Antioqueño Tapa Roja",
        alcohol: "29%",
        descripcion: "El clásico con azúcar; perfil anisado más tradicional.",
      },
      {
        marca: "Aguardiente Antioqueño Tapa Azul",
        alcohol: "29%",
        descripcion: "Sin azúcar; seco, más firme de entrada.",
      },
      {
        marca: "Aguardiente Antioqueño Tapa Verde",
        alcohol: "24%",
        descripcion: "Sin azúcar; más suave y fácil de tomar.",
      },
      {
        marca: "Aguardiente Amarillo de Manzanares",
        alcohol: "24%",
        descripcion: "Amarillo, anisado suave, muy visible en retail colombiano.",
      },
      {
        marca: "Antioqueño Real Amarillo",
        alcohol: "24%",
        descripcion: "Variante amarilla/premium, con perfil más redondo y de coctelería.",
      },
    ],
  },
  {
    categoria: "Ron",
    items: [
      {
        marca: "Ron Medellín Añejo 3 Años",
        alcohol: "35%",
        descripcion: "Ron joven añejado 3 años; notas de madera y vainilla, color dorado claro.",
      },
      {
        marca: 'Ron Viejo de Caldas Tradicional ("normal")',
        alcohol: "35%",
        descripcion: "Ron base de la marca; sabor dulce frutal, madera baja y ligero amargor.",
      },
      {
        marca: "Ron Medellín 5 Años",
        alcohol: "35%-40%",
        descripcion: "Extra añejo, notas de vainilla, caramelo y fruta madura.",
      },
      {
        marca: "Ron Medellín 8 Años",
        alcohol: "35%-40%",
        descripcion: "Más cuerpo y complejidad; vainilla, caramelo, frutas secas.",
      },
      {
        marca: "Ron Medellín 12 Años",
        alcohol: "35%-40%",
        descripcion: "Gran reserva; más fino, redondo y elegante.",
      },
      {
        marca: "Ron Viejo de Caldas 5 Años",
        alcohol: "35%",
        descripcion: "Dulce con baja acidez; avainillado, frutos secos.",
      },
      {
        marca: "Ron Viejo de Caldas 8 Años Carta de Oro",
        alcohol: "35%",
        descripcion: "Más tostado y maderoso; caramelo, vainilla y coco.",
      },
      {
        marca: "Ron Viejo de Caldas 15 Años Gran Reserva",
        alcohol: "35%-40%",
        descripcion: "Expresión más premium; mayor profundidad y largo final.",
      },
    ],
  },
  {
    categoria: "Whisky",
    items: [
      {
        marca: "Buchanan’s Deluxe 12",
        alcohol: "40%",
        descripcion: "Scotch suave, cítrico, con notas de naranja y chocolate.",
      },
      {
        marca: "Old Parr 12",
        alcohol: "40%",
        descripcion: "Miel, fruta y hojas verdes; perfil amable y redondo.",
      },
      {
        marca: "Johnnie Walker Black Label",
        alcohol: "40%",
        descripcion: "Fruta, especia, vainilla y humo leve.",
      },
      {
        marca: "Jack Daniel’s Old No. 7",
        alcohol: "40% aprox.",
        descripcion: "Tennessee whiskey charcoal mellowed; más dulce, vainilla/caramelo/madera.",
      },
    ],
  },
  {
    categoria: "Cerveza",
    items: [
      {
        marca: "Pilsen",
        alcohol: "4.0%-4.2%",
        descripcion: "Lager paisa histórica; ícono regional de Antioquia.",
      },
      {
        marca: "Club Colombia Dorada",
        alcohol: "4.70%",
        descripcion: 'Lager dorada, cuerpo medio, perfil más "premium".',
      },
      {
        marca: "Club Colombia Roja",
        alcohol: "4.50%",
        descripcion: "Roja tipo lager; notas caramelo y amargor ligero.",
      },
      {
        marca: "Club Colombia Negra",
        alcohol: "4.70%",
        descripcion: "Negra lager; maltas tostadas, café y chocolate.",
      },
      {
        marca: "Club Colombia Trigo",
        alcohol: "4.70%",
        descripcion: "Trigo suave y cremosa; perfil más refrescante.",
      },
      {
        marca: "Águila Original",
        alcohol: "4.00%",
        descripcion: "Lager ligera, muy masiva y de rotación rápida.",
      },
      {
        marca: "Águila Light",
        alcohol: "3.4%-4.0%",
        descripcion: "Versión más liviana; menor cuerpo.",
      },
      {
        marca: "Costeñita",
        alcohol: "4.00%",
        descripcion: "Lager pequeña de alta rotación y consumo casual.",
      },
      {
        marca: "Poker",
        alcohol: "4.00%",
        descripcion: "Lager muy popular y transversal en Colombia.",
      },
      {
        marca: "Andina",
        alcohol: "4.00%",
        descripcion: "Lager balanceada, refrescante, con buen cuerpo medio.",
      },
      {
        marca: "Tecate",
        alcohol: "4.50%",
        descripcion: "Pilsner dorada, amargor suave, estilo más mexicano.",
      },
      {
        marca: "Heineken",
        alcohol: "5.00%",
        descripcion: "Lager importada, perfil más seco y clásico europeo.",
      },
    ],
  },
  {
    categoria: "Vino",
    items: [
      {
        marca: "Lambrusco Lunato (tinto / rosado)",
        alcohol: "8% aprox.",
        descripcion: "Lambrusco dulce, espumoso y fácil de tomar.",
      },
      {
        marca: "Casillero del Diablo Cabernet Sauvignon",
        alcohol: "13.50%",
        descripcion: "Tinto chileno más estructurado; fruta negra y madera.",
      },
      {
        marca: "Gato Negro Cabernet Sauvignon",
        alcohol: "13% aprox.",
        descripcion: "Tinto de entrada, frutal y amable.",
      },
      {
        marca: "Santa Rita Tres Medallas Cabernet Sauvignon",
        alcohol: "13%-13.5%",
        descripcion: "Tinto chileno clásico; ciruela, vainilla, algo de roble.",
      },
      {
        marca: "Segú Ollé Tinto Tetra",
        alcohol: "12%",
        descripcion: "Vino de consumo diario, suave y ligeramente dulce.",
      },
      {
        marca: "Vino Tinto Embajador",
        alcohol: "10%",
        descripcion: "Vino tinto chileno de entrada.",
      },
      {
        marca: "Sansón Tradicional",
        alcohol: "13%",
        descripcion: "Vino compuesto aromatizado con hierbas; perfil dulce, caoba oscuro y muy tradicional.",
      },
    ],
  },
  {
    categoria: "Brandy",
    items: [
      {
        marca: "Domecq",
        alcohol: "35%",
        descripcion: "El brandy más visible en retail local; vínico, roble, frutos secos.",
      },
      {
        marca: "Domecq 8 Años",
        alcohol: "35%",
        descripcion: "Más afinado y amable; miel, pera confitada, final suave.",
      },
      {
        marca: "Cinco Estrellas",
        alcohol: "35%",
        descripcion: "Brandy económico y de alta presencia en canal popular.",
      },
      {
        marca: "Don Pedro 12 Años",
        alcohol: "38%",
        descripcion: "Más robusto y añejo; pensado para tomar solo o en cóctel.",
      },
    ],
  },
  {
    categoria: "Crema de licor",
    items: [
      {
        marca: "Baileys Original Irish Cream",
        alcohol: "17%",
        descripcion: "Crema de whisky/irish cream; cacao, vainilla y perfil postre.",
      },
    ],
  },
  {
    categoria: "Tequila",
    items: [
      {
        marca: "Jose Cuervo Especial Reposado",
        alcohol: "38%-40%",
        descripcion: "Tequila oro / reposado; muy usado en shots y coctelería.",
      },
      {
        marca: "Jose Cuervo Tradicional Reposado",
        alcohol: "40%",
        descripcion: "100% agave azul; perfil más serio y premium.",
      },
      {
        marca: "Bandolero Reposado",
        alcohol: "35%",
        descripcion: "Reposado de alto movimiento local; pensado para shot y mezcla.",
      },
    ],
  },
  {
    categoria: "Margarita",
    items: [
      {
        marca: "Jose Cuervo Authentic Classic Margarita",
        alcohol: "9.95%",
        descripcion: 'RTD de tequila, lima y naranja; "just chill or add ice".',
      },
    ],
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b1220] font-sans">
      {/* Encabezado */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-[#0b1220] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

        <header className="relative z-10 mx-auto max-w-7xl px-6 py-16 text-center text-white sm:px-10 lg:px-16">
          <h1 className="mt-5 text-4xl font-extrabold uppercase tracking-[0.14em] sm:text-5xl md:text-6xl">
            Marcas Representadas
          </h1>
          <p className="mt-6 text-base leading-8 text-white/80 sm:text-lg">
            Descubre las marcas de licores colombianos que distribuimos.
          </p>
        </header>
      </section>

      {/* Tabla */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              Portafolio de marcas
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-center">
              <thead className="bg-gray-800 text-center text-white">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                    Categoría
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                    Marca / referencia
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                    % alc. vol.
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                    Descripción breve
                  </th>
                </tr>
              </thead>

              <tbody>
                {marcasRepresentadas.map((grupo) =>
                  grupo.items.map((item, index) => (
                    <tr key={`${grupo.categoria}-${item.marca}`} className="hover:bg-gray-50">
                      {index === 0 && (
                        <td
                          rowSpan={grupo.items.length}
                          className="border border-gray-300 bg-gray-100 px-4 py-3 align-middle font-bold text-gray-900"
                        >
                          {grupo.categoria}
                        </td>
                      )}

                      <td className="border border-gray-300 px-4 py-3 text-gray-800">
                        {item.marca}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-800 whitespace-nowrap">
                        {item.alcohol}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">
                        {item.descripcion}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
