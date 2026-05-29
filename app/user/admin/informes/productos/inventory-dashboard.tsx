"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FiBox,
  FiTrendingUp,
  FiAlertTriangle,
  FiZap,
  FiDollarSign,
  FiRotateCw,
  FiSearch,
  FiPackage,
  FiEye,
  FiRefreshCw,
  FiChevronRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiPercent,
} from "react-icons/fi";
import { MdInventory2, MdOutlineInventory2 } from "react-icons/md";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { HistorialMovimientos } from "./historial-movimientos";
import Link from "next/link";

const MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

interface ProductMetrics {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  precio_base: number;
  precio_cliente: number;
  iva_porcentaje: number;
  subida_porcentaje: number;
  stock: number;
  imagen: string | null;
  descripcion: string | null;
  estado: string | null;
  pedidos: boolean;
  unidadesVendidas: number;
  ventasTotal: number;
  diasSinMovimiento: number;
  rotacionAnual: number;
  diasPromedioPermanencia: number;
  valorInventario: number;
  estado_stock: 'saludable' | 'alerta' | 'critico' | 'sobrestock';
  rotacion: 'alta' | 'media' | 'baja';
  estrategia: 'estrella' | 'oportunidad' | 'atencion' | 'parado';
}

interface KPISummary {
  valorTotalInventario: number;
  totalProductos: number;
  productosActivos: number;
  productosBajoStock: number;
  productosSinRotacion: number;
  productosProxAgotarse: number;
  margenPromedio: number;
  rotacionPromedio: number;
  capitalInmovilizado: number;
}

interface InventarioResponse {
  kpis: KPISummary;
  productos: ProductMetrics[];
  estadoInventario: {
    saludable: number;
    alerta: number;
    critico: number;
    sobrestock: number;
  };
  movimientos: {
    entradas: number;
    salidas: number;
    saldo: number;
  };
  productosPorCategoria: Array<{
    categoria: string;
    cantidad: number;
    valor: number;
    rotacion: number;
  }>;
}

export default function InventoryDashboard() {
  const [data, setData] = useState<InventarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<ProductMetrics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedRotation, setSelectedRotation] = useState("Todos");

  // Cargar datos
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/inventario/metricas");
        const result = await response.json();

        if (!result.ok) throw new Error(result.error || "Error al cargar métricas");
        setData(result.data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Aplicar filtros
  useMemo(() => {
    if (!data) return;

    let filtered = [...data.productos];

    // Filtro de búsqueda
    if (searchTerm) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const searchable = [
          p.nombre,
          p.categoria ?? "Sin categoria",
          p.estado ?? "Sin estado",
          String(p.precio_base),
          String(p.precio_cliente),
          String(p.stock),
          String(p.iva_porcentaje),
          String(p.subida_porcentaje),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    // Filtro de categoría
    if (selectedCategory !== "Todos") {
      filtered = filtered.filter(p => p.categoria === selectedCategory);
    }

    // Filtro de estado
    if (selectedStatus !== "Todos") {
      filtered = filtered.filter(p => p.estado_stock === selectedStatus);
    }

    // Filtro de rotación
    if (selectedRotation !== "Todos") {
      filtered = filtered.filter(p => p.rotacion === selectedRotation);
    }

    setFilteredProducts(filtered);
  }, [data, searchTerm, selectedCategory, selectedStatus, selectedRotation]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <FiRefreshCw className="h-8 w-8 animate-spin text-sky-400" />
          <p className="text-slate-300">Cargando métricas del inventario...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-red-300">{error || "Error cargando datos"}</p>
        </div>
      </div>
    );
  }

  const categories = ["Todos", ...Array.from(new Set(data.productos.map(p => p.categoria)))].filter(Boolean) as string[];
  const statusOptions = ["Todos", "saludable", "alerta", "critico", "sobrestock"];
  const rotationOptions = ["Todos", "alta", "media", "baja"];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="space-y-4 border-b border-sky-400/20 pb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Gestión de Inventario
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                Rotación de Inventario
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Control en tiempo real de stock, rotación de productos y optimización de compras.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <Link
                href="/user/admin/products"
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:border-sky-300 hover:bg-sky-500/20"
              >
                Ver Productos
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:border-sky-300 hover:bg-sky-500/20"
              >
                <FiRefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard
            icon={<FiDollarSign className="h-6 w-6" />}
            label="Valor Total"
            value={`$${(data.kpis.valorTotalInventario / 1000000).toFixed(1)}M`}
            color="from-emerald-500/20 to-emerald-600/20"
            borderColor="border-emerald-500/30"
          />
          <KPICard
            icon={<FiBox className="h-6 w-6" />}
            label="Productos Activos"
            value={`${data.kpis.productosActivos}/${data.kpis.totalProductos}`}
            color="from-blue-500/20 to-blue-600/20"
            borderColor="border-blue-500/30"
          />
          <KPICard
            icon={<FiAlertTriangle className="h-6 w-6" />}
            label="Bajo Stock"
            value={data.kpis.productosBajoStock}
            color="from-amber-500/20 to-amber-600/20"
            borderColor="border-amber-500/30"
            badge={data.kpis.productosBajoStock > 0 ? <HiOutlineExclamationCircle className="h-5 w-5" /> : <FiCheckCircle className="h-5 w-5" />}
          />
          <KPICard
            icon={<FiZap className="h-6 w-6" />}
            label="Sin Rotación"
            value={data.kpis.productosSinRotacion}
            color="from-cyan-500/20 to-cyan-600/20"
            borderColor="border-cyan-500/30"
            badge={data.kpis.productosSinRotacion > 0 ? <FiClock className="h-5 w-5" /> : <FiCheckCircle className="h-5 w-5" />}
          />
          <KPICard
            icon={<FiTrendingUp className="h-6 w-6" />}
            label="Próx. Agotarse"
            value={data.kpis.productosProxAgotarse}
            color="from-red-500/20 to-red-600/20"
            borderColor="border-red-500/30"
            badge={data.kpis.productosProxAgotarse > 0 ? <FiAlertTriangle className="h-5 w-5" /> : <FiCheckCircle className="h-5 w-5" />}
          />
        </section>

        {/* Estado del Inventario - Semáforo */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
            <div className="flex items-center gap-3 mb-6">
              <MdInventory2 className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-bold">Estado del Inventario</h2>
            </div>

            <div className="space-y-3">
              <StatusItem
                label="Saludable"
                count={data.estadoInventario.saludable}
                color="bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                icon={<FiCheckCircle className="h-5 w-5" />}
              />
              <StatusItem
                label="Alerta"
                count={data.estadoInventario.alerta}
                color="bg-amber-500/20 border-amber-500/50 text-amber-300"
                icon={<FiAlertTriangle className="h-5 w-5" />}
              />
              <StatusItem
                label="Crítico"
                count={data.estadoInventario.critico}
                color="bg-red-500/20 border-red-500/50 text-red-300"
                icon={<HiOutlineExclamationCircle className="h-5 w-5" />}
              />
              <StatusItem
                label="Sobrestock"
                count={data.estadoInventario.sobrestock}
                color="bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                icon={<FiPackage className="h-5 w-5" />}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total</span>
                <span className="font-bold text-lg">
                  {(data.estadoInventario.saludable +
                    data.estadoInventario.alerta +
                    data.estadoInventario.critico +
                    data.estadoInventario.sobrestock).toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </div>

          {/* Movimientos */}
          <div className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
            <div className="flex items-center gap-3 mb-6">
              <FiRotateCw className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-bold">Movimientos (24h)</h2>
            </div>

            <div className="space-y-4">
              <MovementItem
                icon={<FiTrendingUp className="h-5 w-5" />}
                label="Entradas"
                value={data.movimientos.entradas}
                color="text-emerald-400"
              />
              <MovementItem
                icon={<FiTrendingUp className="h-5 w-5 rotate-180" />}
                label="Salidas"
                value={data.movimientos.salidas}
                color="text-orange-400"
              />
              <div className="my-3 border-t border-slate-700" />
              <MovementItem
                icon={
                  data.movimientos.saldo >= 0 ? (
                    <FiCheckCircle className="h-5 w-5" />
                  ) : (
                    <HiOutlineExclamationCircle className="h-5 w-5" />
                  )
                }
                label="Saldo"
                value={data.movimientos.saldo}
                color={data.movimientos.saldo >= 0 ? "text-emerald-400" : "text-red-400"}
              />
            </div>
          </div>

          {/* Capital Inmovilizado */}
          <div className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
            <div className="flex items-center gap-3 mb-6">
              <FiPercent className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-bold">Capital Inmovilizado</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Inventario sin rotación (mayor a 60 días)</p>
                <p className="mt-2 text-3xl font-bold text-red-400">
                  ${(data.kpis.capitalInmovilizado / 1000000).toLocaleString("es-CO", {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  })}M
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {(
                    (data.kpis.capitalInmovilizado / data.kpis.valorTotalInventario) *
                    100
                  ).toLocaleString("es-CO", {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  })}% del inventario total
                </p>
              </div>
              <div className="mt-4 rounded-2xl bg-red-500/10 p-4 border border-red-500/30">
                <div className="flex items-start gap-2">
                  <FiZap className="h-4 w-4 text-red-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300">
                    Considera promociones o liquidaciones para estos productos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiBarChart2 className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold">Valor por Categoría</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.productosPorCategoria.map((cat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4"
              >
                <p className="text-sm text-slate-400">{cat.categoria}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  ${(cat.valor / 1000).toLocaleString("es-CO", {
                    maximumFractionDigits: 0,
                  })}K
                </p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{cat.cantidad.toLocaleString("es-CO")} unidades</span>
                  <span className="rounded-full bg-sky-500/20 px-2 py-1 text-sky-300">
                    {cat.rotacion.toLocaleString("es-CO")}/año
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alertas Inteligentes */}
        <section className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
          <div className="flex items-center gap-3 mb-6">
            <HiOutlineExclamationCircle className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-bold">Alertas Inteligentes</h2>
          </div>

          <div className="space-y-3">
            {/* Stock crítico */}
            {data.productos.filter(p => p.estado_stock === 'critico').length > 0 && (
              <AlertItem
                icon={<HiOutlineExclamationCircle className="h-6 w-6" />}
                title="Productos por debajo del stock mínimo"
                count={data.productos.filter(p => p.estado_stock === 'critico').length}
                color="bg-red-500/10 border-red-500/30 text-red-300"
                action="Reabastecer urgente"
              />
            )}

            {/* Próximos a agotarse */}
            {data.kpis.productosProxAgotarse > 0 && (
              <AlertItem
                icon={<FiAlertTriangle className="h-6 w-6" />}
                title="Productos a punto de agotarse"
                count={data.kpis.productosProxAgotarse}
                color="bg-orange-500/10 border-orange-500/30 text-orange-300"
                action="Hacer pedido a proveedor"
              />
            )}

            {/* Sin rotación */}
            {data.kpis.productosSinRotacion > 0 && (
              <AlertItem
                icon={<FiClock className="h-6 w-6" />}
                title="Productos sin ventas hace más de 90 días"
                count={data.kpis.productosSinRotacion}
                color="bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                action="Crear promoción o liquidar"
              />
            )}

            {/* Capital inmovilizado */}
            {data.kpis.capitalInmovilizado > 0 && (
              <AlertItem
                icon={<FiDollarSign className="h-6 w-6" />}
                title="Alto valor en inventario sin rotación"
                count={1}
                color="bg-purple-500/10 border-purple-500/30 text-purple-300"
                action={`${(data.kpis.capitalInmovilizado / 1000000).toLocaleString("es-CO", {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                })}M inmovilizado`}
              />
            )}

            {data.productos.filter(p => p.estado_stock === 'critico').length === 0 &&
              data.kpis.productosProxAgotarse === 0 &&
              data.kpis.productosSinRotacion === 0 && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
                  <p className="text-sm">✅ Inventario en buen estado. Sin alertas críticas.</p>
                </div>
              )}
          </div>
        </section>

        {/* Recomendaciones */}
        <section className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiZap className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold">Recomendaciones Automáticas</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Reabastecer */}
            {data.productos.filter(p => p.rotacion === 'alta' && p.stock < 20).length > 0 && (
              <RecommendationCard
                title="Reabastecer productos de alta rotación"
                count={data.productos.filter(p => p.rotacion === 'alta' && p.stock < 20).length}
                icon={<FiPackage className="h-6 w-6" />}
                action="Solicitar compra"
                color="from-emerald-500/20 to-emerald-600/20"
              />
            )}

            {/* Reducir compras */}
            {data.productos.filter(p => p.estado_stock === 'sobrestock').length > 0 && (
              <RecommendationCard
                title="Reducir compras de productos en sobrestock"
                count={data.productos.filter(p => p.estado_stock === 'sobrestock').length}
                icon={<FiTrendingUp className="h-6 w-6 rotate-180" />}
                action="Revisar pedidos"
                color="from-amber-500/20 to-amber-600/20"
              />
            )}

            {/* Promocionar */}
            {data.productos.filter(p => p.diasSinMovimiento > 30 && p.diasSinMovimiento < 90).length > 0 && (
              <RecommendationCard
                title="Crear promoción para productos con rotación media"
                count={data.productos.filter(p => p.diasSinMovimiento > 30 && p.diasSinMovimiento < 90).length}
                icon={<FiZap className="h-6 w-6" />}
                action="Aplicar descuento"
                color="from-sky-500/20 to-sky-600/20"
              />
            )}

            {/* Liquidar */}
            {data.productos.filter(p => p.diasSinMovimiento > 90).length > 0 && (
              <RecommendationCard
                title="Liquidar productos sin movimiento"
                count={data.productos.filter(p => p.diasSinMovimiento > 90).length}
                icon={<FiAlertTriangle className="h-6 w-6" />}
                action="Crear liquidación"
                color="from-red-500/20 to-red-600/20"
              />
            )}
          </div>
        </section>

        {/* Historial de Movimientos */}
        <section className="rounded-3xl border border-sky-400/20 bg-slate-900/90 p-8">
          <HistorialMovimientos />
        </section>
      </div>
    </main>
  );
}

// Componentes auxiliares
interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  borderColor: string;
  badge?: React.ReactNode;
}

function KPICard({ icon, label, value, color, borderColor, badge }: KPICardProps) {
  return (
    <div
      className={`rounded-2xl border ${borderColor} bg-linear-to-br ${color} p-6 transition hover:border-opacity-50`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString("es-CO") : value}</p>
        </div>
        {badge && <div className="text-amber-400">{badge}</div>}
      </div>
      <div className="mt-4 text-slate-400/60">{icon}</div>
    </div>
  );
}

interface StatusItemProps {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

function StatusItem({ label, count, color, icon }: StatusItemProps) {
  return (
    <div className={`rounded-lg border ${color} bg-opacity-30 p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <div className="text-emerald-400">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-bold text-lg">{count.toLocaleString("es-CO")}</span>
    </div>
  );
}

interface MovementItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function MovementItem({ icon, label, value, color }: MovementItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <span className="text-slate-300">{label}</span>
      </div>
      <span className={`font-bold text-lg ${color}`}>{value.toLocaleString("es-CO")}</span>
    </div>
  );
}

interface AlertItemProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  action: string;
}

function AlertItem({ icon, title, count, color, action }: AlertItemProps) {
  return (
    <div className={`rounded-2xl border ${color} bg-opacity-20 p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className="text-red-400">{icon}</div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs opacity-75">{count.toLocaleString("es-CO")} producto(s) afectado(s)</p>
        </div>
      </div>
      <button className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/20">
        {action}
      </button>
    </div>
  );
}

interface RotationBadgeProps {
  rotation: 'alta' | 'media' | 'baja';
}

function RotationBadge({ rotation }: RotationBadgeProps) {
  const configs = {
    alta: { label: "Alta", color: "bg-emerald-500/20 text-emerald-300" },
    media: { label: "Media", color: "bg-amber-500/20 text-amber-300" },
    baja: { label: "Baja", color: "bg-red-500/20 text-red-300" },
  };
  const config = configs[rotation];
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'saludable' | 'alerta' | 'critico' | 'sobrestock';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    saludable: { icon: "🟢", label: "Saludable" },
    alerta: { icon: "🟡", label: "Alerta" },
    critico: { icon: "🔴", label: "Crítico" },
    sobrestock: { icon: "🧊", label: "Sobrestock" },
  };
  const config = configs[status];
  return (
    <div className="flex items-center justify-center gap-1">
      <span>{config.icon}</span>
      <span className="text-xs">{config.label}</span>
    </div>
  );
}

function ProductStateBadge({ estado, stock }: { estado: string | null; stock: number }) {
  const normalized = (estado ?? "").toLowerCase();
  const agotado = stock <= 0;
  const label = agotado ? "Agotado" : estado ?? "Sin estado";
  const color =
    normalized === "inactivo"
      ? "bg-white/10 text-white/55 ring-white/10"
      : normalized === "no disponible"
        ? "bg-amber-500/10 text-amber-100 ring-amber-400/20"
        : agotado
          ? "bg-orange-500/10 text-orange-100 ring-orange-400/20"
          : "bg-emerald-500/10 text-emerald-100 ring-emerald-400/20";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${color}`}>
      {label}
    </span>
  );
}

interface RecommendationCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  action: string;
  color: string;
}

function RecommendationCard({ title, count, icon, action, color }: RecommendationCardProps) {
  return (
    <div className={`rounded-2xl border border-sky-400/20 bg-linear-to-br ${color} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-300">{count.toLocaleString("es-CO")} producto(s)</p>
        </div>
        <div className="text-emerald-400">{icon}</div>
      </div>
      <button className="mt-3 w-full rounded-lg border border-sky-400/50 bg-sky-400/10 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-400/20">
        {action}
      </button>
    </div>
  );
}
