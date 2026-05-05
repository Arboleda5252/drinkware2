"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import FilterDropdown from "./filter-dropdown";

type SummaryStats = {
  totalProducts: number;
  totalSales: number;
  averageTicket: number;
};

type ProductSummary = {
  name: string;
  sold: number;
  revenue: number;
  share: number;
};

export type ProductDetail = {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  margin: number;
  sold: number;
  revenue: number;
  share: number;
  avgTicket: number;
  inventoryDays: number;
  stock: number;
  velocity: string;
  rotation: string;
  trend: string;
  trendText: string;
  marginPerUnit: number;
  profit: number;
  related: string[];
  buyerProfiles: string[];
  recommendation: string;
  strategic: "Verde" | "Amarillo" | "Rojo";
  classification: string;
  image: string;
};

type FilterValues = {
  category: string;
  priceRange: string;
  salesLevel: string;
  marginLevel: string;
};

type Props = {
  summary: SummaryStats;
  topProducts: ProductSummary[];
  initialProducts: ProductDetail[];
};

const categoryOptions = [
  { value: "Todos", label: "Todas las categorías" },
  { value: "Licores", label: "Licores" },
  { value: "Cervezas", label: "Cervezas" },
  { value: "Mixers", label: "Mixers" },
];

const priceRanges = [
  { value: "Todos", label: "Todo rango" },
  { value: "low", label: "Menos de $20.000" },
  { value: "mid", label: "$20.000 - $50.000" },
  { value: "high", label: "Más de $50.000" },
];

const salesLevels = [
  { value: "Todos", label: "Todos los niveles" },
  { value: "high", label: "Alto" },
  { value: "medium", label: "Medio" },
  { value: "low", label: "Bajo" },
];

const marginLevels = [
  { value: "Todos", label: "Todos los márgenes" },
  { value: "high", label: "> 45%" },
  { value: "mid", label: "30 - 45%" },
  { value: "low", label: "< 30%" },
];

const strategicLabels: Record<string, { text: string; color: string }> = {
  Verde: { text: "Estrella", color: "bg-emerald-500/15 text-emerald-300" },
  Amarillo: { text: "Oportunidad", color: "bg-amber-500/15 text-amber-300" },
  Rojo: { text: "Atención", color: "bg-rose-500/15 text-rose-300" },
};

export default function ProductReportShell({ summary, topProducts, initialProducts }: Props) {
  const [filters, setFilters] = useState<FilterValues>({
    category: "Todos",
    priceRange: "Todos",
    salesLevel: "Todos",
    marginLevel: "Todos",
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductDetail>(initialProducts[0]);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const closeModal = () => setProductModalOpen(false);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      if (filters.category !== "Todos" && product.category !== filters.category) {
        return false;
      }

      if (filters.priceRange === "low" && product.price >= 20000) {
        return false;
      }
      if (filters.priceRange === "mid" && (product.price < 20000 || product.price > 50000)) {
        return false;
      }
      if (filters.priceRange === "high" && product.price <= 50000) {
        return false;
      }

      if (filters.salesLevel === "high" && product.sold < 900) {
        return false;
      }
      if (filters.salesLevel === "medium" && (product.sold < 500 || product.sold >= 900)) {
        return false;
      }
      if (filters.salesLevel === "low" && product.sold >= 500) {
        return false;
      }

      if (filters.marginLevel === "high" && product.margin <= 45) {
        return false;
      }
      if (filters.marginLevel === "mid" && (product.margin < 30 || product.margin > 45)) {
        return false;
      }
      if (filters.marginLevel === "low" && product.margin >= 30) {
        return false;
      }

      return true;
    });
  }, [filters, initialProducts]);

  const activeProduct = filteredProducts.find((product) => product.id === selectedProduct.id) ?? filteredProducts[0] ?? selectedProduct;

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: "Todos", priceRange: "Todos", salesLevel: "Todos", marginLevel: "Todos" });
  };

  const visibleProducts = filteredProducts.length > 0 ? filteredProducts : initialProducts;

  const averageMargin = useMemo(() => {
    const products = visibleProducts.length ? visibleProducts : initialProducts;
    return products.length ? Math.round(products.reduce((sum, item) => sum + item.margin, 0) / products.length) : 0;
  }, [visibleProducts, initialProducts]);

  const averageInventoryDays = useMemo(() => {
    const products = visibleProducts.length ? visibleProducts : initialProducts;
    return products.length ? Math.round(products.reduce((sum, item) => sum + item.inventoryDays, 0) / products.length) : 0;
  }, [visibleProducts, initialProducts]);

  const saveBlob = (blob: Blob, fileName: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadExcel = () => {
    const headers = [
      "ID",
      "Nombre",
      "Categoría",
      "Precio",
      "Costo",
      "Margen",
      "Ventas",
      "Ingresos",
      "Participación",
      "Stock",
      "Días inventario",
      "Rotación",
      "Tendencia",
    ];

    const rows = visibleProducts.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.cost,
      `${product.margin}%`,
      product.sold,
      product.revenue,
      `${product.share}%`,
      product.stock,
      product.inventoryDays,
      product.rotation,
      product.trend,
    ]);

    const table = `
      <table>
        <thead>
          <tr>${headers
            .map((header) => `<th style="padding:8px;border:1px solid #ddd;background:#f3f4f6;">${header}</th>`)
            .join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td style="padding:8px;border:1px solid #ddd;">${cell}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    const blob = new Blob([`<html><head><meta charset="UTF-8"></head><body>${table}</body></html>`], {
      type: "application/vnd.ms-excel",
    });

    saveBlob(blob, "productos-informe.xls");
  };

  const escapePdfText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const downloadPDF = () => {
    const lines = [
      `Informe por producto`,
      ``,
      `Producto: ${activeProduct.name}`,
      `Categoría: ${activeProduct.category}`,
      `Precio: $${activeProduct.price.toLocaleString()}`,
      `Costo: $${activeProduct.cost.toLocaleString()}`,
      `Margen: ${activeProduct.margin}%`,
      `Ventas: ${activeProduct.sold.toLocaleString()}`,
      `Ingresos: $${activeProduct.revenue.toLocaleString()}`,
      `Participación: ${activeProduct.share}%`,
      `Ticket promedio: $${activeProduct.avgTicket.toLocaleString()}`,
      `Días inventario: ${activeProduct.inventoryDays}`,
      `Stock: ${activeProduct.stock}`,
      `Rotación: ${activeProduct.rotation}`,
      ``,
      `Recomendación: ${activeProduct.recommendation}`,
    ];

    const encodedLines = lines.map((line, index) => {
      const escaped = escapePdfText(line);
      const operator = index === 0 ? `` : `T*\n`;
      return `${operator}(${escaped}) Tj`;
    });

    const contentStream = `BT /F1 12 Tf 50 760 Td\n${encodedLines.join("\n")}\nET`;
    const header = "%PDF-1.3";
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
      `5 0 obj\n<< /Length ${new TextEncoder().encode(contentStream).length} >>\nstream\n${contentStream}\nendstream\nendobj`,
    ];

    let offset = new TextEncoder().encode(`${header}\n`).length;
    const offsets = objects.map((obj) => {
      const current = offset;
      offset += new TextEncoder().encode(`${obj}\n`).length;
      return current;
    });

    const xref = [
      "xref",
      `0 ${objects.length + 1}`,
      "0000000000 65535 f ",
      ...offsets.map((value) => `${value.toString().padStart(10, "0")} 00000 n `),
    ].join("\n");

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
    const pdfString = `${header}\n${objects.join("\n")}\n${xref}\n${trailer}`;
    const pdfBlob = new Blob([pdfString], { type: "application/pdf" });
    saveBlob(pdfBlob, "producto-ficha.pdf");
  };

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.3)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">
            Filtros combinados
          </p>
          <h2 className="text-3xl font-bold text-white">Explora por producto</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Ajusta categoría, rango de precio, nivel de ventas y margen para identificar cuáles productos pesan más en el negocio.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-5 text-sm text-slate-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">Productos activos</p>
                <p className="mt-2">{visibleProducts.length} de {initialProducts.length} productos mostrados</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadExcel}
                  className="rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-500/50 hover:bg-slate-800"
                >
                  Descargar Excel
                </button>
                <button
                  type="button"
                  onClick={downloadPDF}
                  className="rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-500/50 hover:bg-slate-800"
                >
                  Descargar PDF
                </button>
              </div>
            </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6">
        <FilterDropdown
          filters={filters}
          categories={categoryOptions}
          priceRanges={priceRanges}
          salesLevels={salesLevels}
          marginLevels={marginLevels}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total productos</p>
              <p className="mt-3 text-3xl font-bold text-white">{summary.totalProducts}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ventas totales</p>
              <p className="mt-3 text-3xl font-bold text-white">{summary.totalSales.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ticket promedio</p>
              <p className="mt-3 text-3xl font-bold text-white">${summary.averageTicket.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Margen promedio</p>
              <p className="mt-3 text-3xl font-bold text-sky-300">{averageMargin}%</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">Días inventario: {averageInventoryDays}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Productos destacados</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Ficha individual</h3>
                </div>
                <p className="text-sm text-slate-400">Selecciona un producto para ver su impacto real.</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {visibleProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      product.id === activeProduct.id
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-slate-800 bg-slate-950/70 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{product.category}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                        {product.rotation}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ventas</p>
                        <p className="mt-1 text-lg font-semibold text-white">{product.sold.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Margen</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-300">{product.margin}%</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Ficha del producto</p>
              <h3 className="mt-4 text-2xl font-bold text-white">{activeProduct.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Selecciona un producto para abrir su ficha interactiva con información completa, imagen y recomendaciones.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
                <span className="rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {activeProduct.category}
                </span>
                <span className="rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {activeProduct.rotation}
                </span>
                <span className="rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {strategicLabels[activeProduct.strategic].text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="mt-6 inline-flex items-center justify-center rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Abrir ficha interactiva
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Alertas inteligentes</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-100">
                <p className="font-semibold text-white">Producto con alto stock y bajas ventas</p>
                <p className="mt-2 text-slate-300">{activeProduct.stock > 60 && activeProduct.sold < 600 ? "Revisa logística de promoción para evitar exceso de inventario." : ""}</p>
              </div>
              <div className="rounded-3xl bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-semibold text-white">Producto próximo a agotarse</p>
                <p className="mt-2 text-slate-300">{activeProduct.stock < 20 ? "Prioriza reposición para no perder ventas." : ""}</p>
              </div>
              <div className="rounded-3xl bg-sky-500/10 p-4 text-sm text-slate-100">
                <p className="font-semibold text-white">Producto con caída en ventas</p>
                <p className="mt-2 text-slate-300">{activeProduct.trend === "En caída" ? "Estudia promociones o cambio de precio." : ""}</p>
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Productos relacionados</p>
            <div className="mt-5 grid gap-3">
              {activeProduct.related.map((item) => (
                <div key={item} className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Perfil de comprador</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeProduct.buyerProfiles.map((profile) => (
                <span key={profile} className="rounded-full bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {profile}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Recomendaciones automáticas</p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>&bull; {activeProduct.recommendation}</p>
              <p>&bull; Predicción de ventas por producto disponible en el siguiente ciclo.</p>
              <p>&bull; Ranking de rentabilidad por producto prioriza resultados reales, no solo volumen.</p>
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Acciones rápidas</p>
            <div className="mt-4 grid gap-3">
              {[
                "Aplicar descuento",
                "Crear combo",
                "Ajustar precio",
                "Ver historial",
                "Actualizar stock",
              ].map((action) => (
                <button key={action} type="button" className="w-full rounded-3xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 text-left text-sm font-semibold text-slate-100 transition hover:border-sky-500/50 hover:bg-slate-800/90">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {productModalOpen ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm transition-all duration-300 ${productModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          aria-hidden={!productModalOpen}
          onClick={closeModal}
        >
          <div
            className={`relative w-full max-w-[95vw] lg:max-w-6xl max-h-[calc(100vh-3rem)] overflow-hidden rounded-4xl border border-white/10 bg-slate-900/95 shadow-[0_30px_80px_rgba(0,0,0,0.75)] ring-1 ring-white/10 transform transition-all duration-300 ${productModalOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/90 text-slate-200 transition hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_0.85fr] p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-4xl border border-white/10 bg-slate-950/80">
                  <Image
                    src={`/${activeProduct.image}`}
                    alt={activeProduct.name}
                    width={900}
                    height={520}
                    className="h-64 w-full object-cover sm:h-80"
                  />
                </div>

                <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">{activeProduct.category}</p>
                      <h2 className="mt-3 text-3xl font-bold text-white">{activeProduct.name}</h2>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${strategicLabels[activeProduct.strategic].color}`}>
                      {strategicLabels[activeProduct.strategic].text}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Precio</p>
                      <p className="mt-2 text-2xl font-semibold text-white">${activeProduct.price.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Costo</p>
                      <p className="mt-2 text-2xl font-semibold text-white">${activeProduct.cost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Rendimiento del producto</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unidades vendidas</p>
                      <p className="mt-2 text-3xl font-bold text-white">{activeProduct.sold.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ingresos</p>
                      <p className="mt-2 text-3xl font-bold text-sky-300">${activeProduct.revenue.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ticket promedio</p>
                      <p className="mt-2 text-3xl font-bold text-white">${activeProduct.avgTicket.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Participación</p>
                      <p className="mt-2 text-3xl font-bold text-sky-300">{activeProduct.share}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Tendencia de ventas</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{activeProduct.trendText}</p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Comportamiento</p>
                      <p className="mt-2 text-white">{activeProduct.trend}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                        <span>Velocidad</span>
                        <span>{activeProduct.velocity}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.min(100, Math.round((activeProduct.sold / 1200) * 100))}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Rotación de inventario</p>
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Días en inventario</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{activeProduct.inventoryDays}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Stock actual</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{activeProduct.stock}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Clasificación</p>
                      <p className="mt-2 text-white">{activeProduct.classification}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Productos relacionados</p>
                  <div className="mt-4 space-y-3">
                    {activeProduct.related.map((item) => (
                      <div key={item} className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">Recomendaciones</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{activeProduct.recommendation}</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
