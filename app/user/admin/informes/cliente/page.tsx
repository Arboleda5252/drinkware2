'use server';

import Link from "next/link";
import { sql } from "@/app/Datalibs/database";

type CustomerReport = {
  id: number;
  name: string;
  username: string;
  orders: number;
  revenue: number;
  avgTicket: number;
  lastPurchase: string | null;
  topCategory: string;
};

type ClientOverview = {
  newCustomers: number;
  recurringCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
};

type CategoryPreference = {
  category: string;
  revenue: number;
  percentage: number;
};

async function getTopCustomers(): Promise<CustomerReport[]> {
  const { rows } = await sql<{
    idcliente: number;
    nombre: string | null;
    apellido: string | null;
    nombreusuario: string | null;
    orders: number;
    revenue: number;
    avg_ticket: number;
    last_purchase: string | null;
  }>(`
    SELECT
      u.idusuario AS idcliente,
      u.nombre,
      u.apellido,
      u.nombreusuario,
      COUNT(p.id_pedido)::int AS orders,
      COALESCE(SUM(p.total::numeric), 0) AS revenue,
      COALESCE(AVG(p.total::numeric), 0) AS avg_ticket,
      MAX(p.fecha_creacion) AS last_purchase
    FROM public.pedido p
    JOIN public.usuario u ON p.id_cliente = u.idusuario
    WHERE p.id_cliente IS NOT NULL
    GROUP BY u.idusuario, u.nombre, u.apellido, u.nombreusuario
    ORDER BY orders DESC, revenue DESC
    LIMIT 6;
  `);

  return rows.map((row) => ({
    id: Number(row.idcliente),
    name: [row.nombre, row.apellido].filter(Boolean).join(" ") || row.nombreusuario || "Cliente anónimo",
    username: row.nombreusuario || "sin usuario",
    orders: Number(row.orders),
    revenue: Number(row.revenue),
    avgTicket: Number(row.avg_ticket),
    lastPurchase: row.last_purchase,
    topCategory: "",
  }));
}

async function getCustomerPreferences(customerIds: number[]) {
  if (customerIds.length === 0) return new Map<number, string>();

  const { rows } = await sql<{
    id_cliente: number;
    category: string | null;
    revenue: number;
  }>(`
    SELECT
      p.id_cliente AS id_cliente,
      prod.categoria AS category,
      COALESCE(SUM(dp.subtotal::numeric), 0) AS revenue
    FROM public.detalle_pedido dp
    JOIN public.pedido p ON dp.id_pedido = p.id_pedido
    JOIN public.producto prod ON dp.id_producto = prod.idproducto
    WHERE p.id_cliente = ANY($1::int[])
    GROUP BY p.id_cliente, prod.categoria
    ORDER BY p.id_cliente, revenue DESC
  `, [customerIds]);

  const topCategoryByCustomer = new Map<number, string>();

  for (const row of rows) {
    const customerId = Number(row.id_cliente);
    if (!topCategoryByCustomer.has(customerId) && row.category) {
      topCategoryByCustomer.set(customerId, row.category);
    }
  }

  return topCategoryByCustomer;
}

async function getClientOverview(): Promise<ClientOverview> {
  const { rows } = await sql<{
    new_customers: number;
    recurring_customers: number;
    active_customers: number;
    total_revenue: number;
    total_orders: number;
    avg_ticket: number;
  }>(`
    SELECT
      SUM(CASE WHEN order_count = 1 THEN 1 ELSE 0 END)::int AS new_customers,
      SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)::int AS recurring_customers,
      COUNT(*)::int AS active_customers,
      COALESCE(SUM(total_revenue), 0) AS total_revenue,
      COALESCE(SUM(order_count), 0) AS total_orders,
      COALESCE(ROUND(AVG(avg_ticket)::numeric, 0), 0) AS avg_ticket
    FROM (
      SELECT
        p.id_cliente,
        COUNT(*) AS order_count,
        COALESCE(SUM(p.total::numeric), 0) AS total_revenue,
        COALESCE(AVG(p.total::numeric), 0) AS avg_ticket
      FROM public.pedido p
      WHERE p.id_cliente IS NOT NULL
      GROUP BY p.id_cliente
    ) AS sub;
  `);

  const first = rows[0];
  return {
    newCustomers: Number(first?.new_customers ?? 0),
    recurringCustomers: Number(first?.recurring_customers ?? 0),
    activeCustomers: Number(first?.active_customers ?? 0),
    totalRevenue: Number(first?.total_revenue ?? 0),
    totalOrders: Number(first?.total_orders ?? 0),
    avgTicket: Number(first?.avg_ticket ?? 0),
  };
}

async function getTopCategoryPreferences(): Promise<CategoryPreference[]> {
  const { rows } = await sql<{
    category: string | null;
    revenue: number;
  }>(`
    SELECT
      prod.categoria AS category,
      COALESCE(SUM(dp.subtotal::numeric), 0) AS revenue
    FROM public.detalle_pedido dp
    JOIN public.pedido p ON dp.id_pedido = p.id_pedido
    JOIN public.producto prod ON dp.id_producto = prod.idproducto
    WHERE p.id_cliente IS NOT NULL
    GROUP BY prod.categoria
    ORDER BY revenue DESC
    LIMIT 4;
  `);

  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0) || 1;

  return rows.map((row) => ({
    category: row.category || "Sin categoría",
    revenue: Number(row.revenue),
    percentage: Math.round((Number(row.revenue) / totalRevenue) * 100),
  }));
}

function formatDate(value: string | null) {
  if (!value) return "Sin compra reciente";
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CustomerReportPage() {
  const [topCustomers, overview, preferences] = await Promise.all([
    getTopCustomers(),
    getClientOverview(),
    getTopCategoryPreferences(),
  ]);

  const customerIds = topCustomers.map((customer) => customer.id);
  const customerPreferences = await getCustomerPreferences(customerIds);
  const customersWithPref = topCustomers.map((customer) => ({
    ...customer,
    topCategory: customerPreferences.get(customer.id) || "Sin preferencia definida",
  }));

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-4xl border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Informe por cliente
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Consumidores frecuentes y preferencias
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Analiza a tus clientes más valiosos, compara nuevos y recurrentes, revisa frecuencia de compra y el ticket promedio por consumidor.
              </p>
            </div>

            <Link
              href="/user/admin/informes"
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Volver a informes
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Clientes recurrentes</p>
              <p className="mt-3 text-3xl font-bold text-sky-300">{overview.recurringCustomers}</p>
              <p className="mt-2 text-sm text-slate-500">Compran más de una vez</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Nuevos clientes</p>
              <p className="mt-3 text-3xl font-bold text-white">{overview.newCustomers}</p>
              <p className="mt-2 text-sm text-slate-500">Primer pedido registrado</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ticket promedio</p>
              <p className="mt-3 text-3xl font-bold text-white">${overview.avgTicket.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-500">Promedio por cliente</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pedidos totales</p>
              <p className="mt-3 text-3xl font-bold text-sky-300">{overview.totalOrders.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-500">Transacciones con cliente</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <div className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Consumidores más frecuentes</h2>
                <p className="mt-2 text-sm text-slate-400">Los clientes que generan más pedidos e ingresos.</p>
              </div>
              <span className="rounded-full bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                {overview.activeCustomers} clientes activos
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {customersWithPref.map((customer) => (
                <div key={customer.id} className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 transition hover:border-sky-300/40">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{customer.username}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{customer.name}</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                        <p className="font-semibold text-slate-100">Pedidos</p>
                        <p className="mt-2 text-lg font-bold text-white">{customer.orders}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                        <p className="font-semibold text-slate-100">Ticket</p>
                        <p className="mt-2 text-lg font-bold text-sky-300">${customer.avgTicket.toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                        <p className="font-semibold text-slate-100">Preferencia</p>
                        <p className="mt-2 text-lg font-bold text-white">{customer.topCategory}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-400">
                    <span>Ingreso total: ${customer.revenue.toLocaleString()}</span>
                    <span>Última compra: {formatDate(customer.lastPurchase)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-sm">
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Preferencias generales</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Categorías favoritas</h3>
              </div>

              <div className="space-y-4">
                {preferences.map((pref) => (
                  <div key={pref.category} className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">{pref.category}</p>
                        <p className="mt-2 text-2xl font-bold text-sky-300">${pref.revenue.toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                        {pref.percentage}%
                      </span>
                    </div>
                    <div className="mt-4 h-2 bg-slate-800/30 rounded-full overflow-hidden">
                      <div className="h-full bg-linear-to-r from-sky-500 to-sky-400" style={{ width: `${pref.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Frecuencia de compra</p>
                <p className="mt-3 text-xl font-semibold text-white">{overview.totalOrders > 0 ? `${Math.round((overview.totalOrders / Math.max(overview.activeCustomers, 1)) * 10) / 10}` : 0} compras por cliente</p>
                <p className="mt-2 text-sm text-slate-400">Promedio de transacciones por cliente activo.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}