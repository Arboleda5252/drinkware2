"use client";

import { useEffect, useState } from "react";

export interface ProfitabilitySummaryData {
  pedidosPagados: number;
  pedidosPendientes: number;
  precioBaseSinIva: number;
  margenGanancia: number;
  subtotalSinIva: number;
  ivaCalculado: number;
  totalConIva: number;
  margenPromedio: number;
}

interface ProfitabilityAnalysisClientProps {
  quarter: number;
  year: number;
}

interface Pedido {
  idPedido: number;
  fechaCreacion: string;
}

interface DetallePedido {
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

interface Producto {
  id: number;
  precio_base?: number;
  precio?: number;
  iva_porcentaje: number;
  subida_porcentaje: number;
}

interface Pago {
  idPago: number;
  idPedido: number;
  estadoPago: string;
  fechaPago: string | null;
}

type ApiPayload<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
};

const emptySummary: ProfitabilitySummaryData = {
  pedidosPagados: 0,
  pedidosPendientes: 0,
  precioBaseSinIva: 0,
  margenGanancia: 0,
  subtotalSinIva: 0,
  ivaCalculado: 0,
  totalConIva: 0,
  margenPromedio: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isInQuarter(dateValue: string, quarter: number, year: number) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const month = date.getMonth() + 1;
  const monthStart = (quarter - 1) * 3 + 1;
  const monthEnd = quarter * 3;

  return date.getFullYear() === year && month >= monthStart && month <= monthEnd;
}

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as ApiPayload<T>;

  if (!response.ok || payload.ok === false || !payload.data) {
    throw new Error(payload.error || `No se pudo cargar ${url}`);
  }

  return payload.data;
}

function getPreferredPayment(payments: Pago[]) {
  const paid = payments.find((payment) => normalizeStatus(payment.estadoPago) === "pagado");
  if (paid) return paid;

  return [...payments].sort((a, b) => b.idPago - a.idPago)[0] ?? null;
}

function buildSummary(
  pedidos: Pedido[],
  detalles: DetallePedido[],
  productos: Producto[],
  pagos: Pago[],
  quarter: number,
  year: number
): ProfitabilitySummaryData {
  const quarterPedidos = pedidos.filter((pedido) => isInQuarter(pedido.fechaCreacion, quarter, year));
  const productById = new Map(productos.map((producto) => [Number(producto.id), producto]));
  const paymentsByOrder = new Map<number, Pago[]>();

  for (const pago of pagos) {
    const idPedido = Number(pago.idPedido);
    const existing = paymentsByOrder.get(idPedido) ?? [];
    existing.push(pago);
    paymentsByOrder.set(idPedido, existing);
  }

  const countedOrderIds = new Set<number>();
  let pedidosPagados = 0;
  let pedidosPendientes = 0;

  for (const pedido of quarterPedidos) {
    const payment = getPreferredPayment(paymentsByOrder.get(Number(pedido.idPedido)) ?? []);
    const status = normalizeStatus(payment?.estadoPago);

    if (status === "pagado") {
      pedidosPagados += 1;
      countedOrderIds.add(Number(pedido.idPedido));
    } else if (status === "pendiente") {
      pedidosPendientes += 1;
      countedOrderIds.add(Number(pedido.idPedido));
    }
  }

  let precioBaseSinIva = 0;
  let margenGanancia = 0;
  let ivaCalculado = 0;
  let margenSuma = 0;
  let margenConteo = 0;

  for (const detalle of detalles) {
    if (!countedOrderIds.has(Number(detalle.idPedido))) continue;

    const producto = productById.get(Number(detalle.idProducto));
    const cantidad = Number(detalle.cantidad) || 0;
    const precioBase = Number(producto?.precio_base ?? producto?.precio ?? detalle.precioUnitario) || 0;
    const subidaPorcentaje = Number(producto?.subida_porcentaje) || 0;
    const ivaPorcentaje = Number(producto?.iva_porcentaje) || 0;

    const baseLinea = cantidad * precioBase;
    const margenLinea = baseLinea * (subidaPorcentaje / 100);
    const subtotalLinea = baseLinea + margenLinea;
    const ivaLinea = subtotalLinea * (ivaPorcentaje / 100);

    precioBaseSinIva += baseLinea;
    margenGanancia += margenLinea;
    ivaCalculado += ivaLinea;

    if (subidaPorcentaje > 0) {
      margenSuma += subidaPorcentaje;
      margenConteo += 1;
    }
  }

  const subtotalSinIva = precioBaseSinIva + margenGanancia;

  return {
    pedidosPagados,
    pedidosPendientes,
    precioBaseSinIva: Math.round(precioBaseSinIva),
    margenGanancia: Math.round(margenGanancia),
    subtotalSinIva: Math.round(subtotalSinIva),
    ivaCalculado: Math.round(ivaCalculado),
    totalConIva: Math.round(subtotalSinIva + ivaCalculado),
    margenPromedio: margenConteo > 0 ? Math.round(margenSuma / margenConteo) : 0,
  };
}

export default function ProfitabilityAnalysisClient({ quarter, year }: ProfitabilityAnalysisClientProps) {
  const [summary, setSummary] = useState<ProfitabilitySummaryData>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const [pedidos, detalles, productos, pagos] = await Promise.all([
          fetchApi<Pedido[]>("/api/pedidos"),
          fetchApi<DetallePedido[]>("/api/detalle_pedido"),
          fetchApi<Producto[]>("/api/productos"),
          fetchApi<Pago[]>("/api/pago"),
        ]);

        if (!active) return;

        setSummary(buildSummary(pedidos, detalles, productos, pagos, quarter, year));
        setError(null);
      } catch (fetchError) {
        if (!active) return;

        setSummary(emptySummary);
        setError(fetchError instanceof Error ? fetchError.message : "No se pudo calcular la rentabilidad");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [quarter, year]);

  return (
    <>
      {loading && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-300">
          Cargando rentabilidad...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pedidos Pagados</p>
          <p className="mt-3 text-3xl font-bold text-green-400">{formatNumber(summary.pedidosPagados)}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pedidos Pendientes</p>
          <p className="mt-3 text-3xl font-bold text-yellow-400">{formatNumber(summary.pedidosPendientes)}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Precio Base</p>
          <p className="mt-3 text-3xl font-bold text-sky-300">{formatCurrency(summary.precioBaseSinIva)}</p>
          <p className="mt-2 text-xs text-slate-500">Producto sin IVA y sin margen</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Margen SUBA</p>
          <p className="mt-3 text-3xl font-bold text-green-400">{formatCurrency(summary.margenGanancia)}</p>
          <p className="mt-2 text-xs text-slate-500">Promedio aplicado: {summary.margenPromedio}%</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Subtotal Sin IVA</p>
          <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(summary.subtotalSinIva)}</p>
          <p className="mt-2 text-xs text-slate-500">Precio base + margen</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">IVA Calculado</p>
          <p className="mt-3 text-3xl font-bold text-amber-400">{formatCurrency(summary.ivaCalculado)}</p>
          <p className="mt-2 text-xs text-slate-500">Segun /api/productos</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total Con IVA</p>
        <p className="mt-3 text-3xl font-bold text-sky-300">{formatCurrency(summary.totalConIva)}</p>
        <p className="mt-2 text-xs text-slate-500">Subtotal sin IVA + IVA calculado</p>
      </div>
    </>
  );
}
