"use client";

import { useState } from "react";
import { FiDollarSign, FiLayers, FiShoppingCart, FiTrendingUp } from "react-icons/fi";

interface QuarterStats {
  quarter: number;
  year: number;
  totalSales: number;
  totalRevenue: number;
  transactionCount: number;
  avgTicket: number;
  growthPercent: number;
  topCategory: string;
}

interface QuarterSummaryProps {
  stats: QuarterStats;
}

interface TopProductDetails {
  id: number;
  nombre: string;
  categoria: string | null;
  imagen: string | null;
  descripcion: string | null;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function QuarterSummary({ stats }: QuarterSummaryProps) {
  const isPositiveGrowth = stats.growthPercent >= 0;
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topProduct, setTopProduct] = useState<TopProductDetails | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  const openModal = async () => {
    setModalOpen(true);
    setButtonPressed(true);
    window.setTimeout(() => setButtonPressed(false), 160);

    if (dataLoaded) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/informes/trimestral/top-product?quarter=${stats.quarter}&year=${stats.year}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "No se pudo cargar el producto más vendido");
      }

      const product: TopProductDetails | null = result.data?.product || null;
      if (!product) {
        setError("No se encontró el producto más vendido para este trimestre.");
        setTopProduct(null);
      } else {
        setTopProduct(product);
      }

      setDataLoaded(true);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setModalOpen(false);

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ventas Totales</p>
              <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              <p className="mt-2 text-xs text-slate-500">Trimestre {stats.quarter}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3 text-sky-300">
              <FiDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Crecimiento vs Anterior</p>
              <p className={`mt-3 text-3xl font-bold ${isPositiveGrowth ? "text-green-400" : "text-red-400"}`}>
                {isPositiveGrowth ? "+" : ""}{formatNumber(stats.growthPercent)}%
              </p>
              <p className="mt-2 text-xs text-slate-500">Variación trimestral</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3 text-emerald-300">
              <FiTrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ticket Promedio</p>
              <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(stats.avgTicket)}</p>
              <p className="mt-2 text-xs text-slate-500">Por transacción</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3 text-violet-300">
              <FiShoppingCart className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Transacciones</p>
              <p className="mt-3 text-3xl font-bold text-white">{formatNumber(stats.transactionCount)}</p>
              <p className="mt-2 text-xs text-slate-500">Número de pedidos</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3 text-cyan-300">
              <FiLayers className="h-6 w-6" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className={`rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-left shadow-sm transition duration-150 ease-out ${buttonPressed ? "scale-[0.98] bg-slate-900/90" : "hover:bg-slate-900/80"}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Top Categoría</p>
              <span className="mt-3 block text-2xl font-bold text-sky-300">{stats.topCategory}</span>
            </div>
            <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              Ver detalle
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Producto más vendido de la categoría</p>
        </button>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 max-w-6xl rounded-4xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl transition-all duration-300 ease-out">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Producto más vendido</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Trimestre {stats.quarter} · {stats.year}</h2>
                <p className="mt-2 text-sm text-slate-400">Categoría líder: {stats.topCategory}</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center rounded-full border border-slate-700/80 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-8">
              {loading ? (
                <div className="rounded-3xl bg-slate-950/80 p-6 text-slate-300">Cargando el producto más vendido...</div>
              ) : error ? (
                <div className="rounded-3xl bg-rose-950/80 p-6 text-rose-300">{error}</div>
              ) : topProduct ? (
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                  <div className="overflow-hidden rounded-3xl bg-slate-950/80 ring-1 ring-white/10">
                    {topProduct.imagen ? (
                      <img
                        src={topProduct.imagen}
                        alt={topProduct.nombre}
                        className="h-80 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-80 items-center justify-center p-6 text-slate-400">
                        Imagen no disponible
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-3xl bg-slate-950/80 p-6">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Producto</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{topProduct.nombre}</p>
                      <p className="mt-2 text-sm text-slate-400">{topProduct.categoria || "Sin categoría"}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-slate-950/80 p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cantidad vendida</p>
                        <p className="mt-4 text-3xl font-bold text-white">{formatNumber(topProduct.total_quantity)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-950/80 p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ingresos</p>
                        <p className="mt-4 text-3xl font-bold text-sky-300">{formatCurrency(topProduct.total_revenue)}</p>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-950/80 p-6">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pedidos</p>
                      <p className="mt-3 text-lg font-semibold text-white">{topProduct.order_count.toLocaleString()} pedidos</p>
                    </div>

                    <div className="rounded-3xl bg-slate-950/80 p-6">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Descripción</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {topProduct.descripcion || "No se proporcionó descripción para este producto."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-slate-950/80 p-6 text-slate-300">No se encontró el producto más vendido de esta categoría.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

