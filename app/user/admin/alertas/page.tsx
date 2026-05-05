"use client";

import * as React from "react";
import { BiAngry } from "react-icons/bi";
import { MdWarningAmber, MdOutlineMarkEmailUnread } from "react-icons/md";
import { FaSpinner } from "react-icons/fa";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  stock: number;
  estados: string | null;
};

type PedidoProveedor = {
  id: number;
  producto_id: number;
  cantidad: number;
  estado: string;
  descripcion: string | null;
  creado_en: string;
};

export default function AdminAlertasPage() {
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pedidosProveedor, setPedidosProveedor] = React.useState<PedidoProveedor[]>([]);
  const [errorPedidos, setErrorPedidos] = React.useState<string | null>(null);
  const [cargandoPedidos, setCargandoPedidos] = React.useState(true);

  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setCargando(true);
        setError(null);
        const res = await fetch("/api/productos", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "No fue posible obtener los productos");
        if (!cancelado) setProductos(json.data as Producto[]);
      } catch (e: any) {
        if (!cancelado) setError(e?.message ?? "Error al cargar notificaciones");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setCargandoPedidos(true);
        setErrorPedidos(null);
        const res = await fetch("/api/productos/productosPedidos", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "No fue posible obtener los pedidos del proveedor");
        if (!cancelado) setPedidosProveedor(json.data as PedidoProveedor[]);
      } catch (e: any) {
        if (!cancelado) setErrorPedidos(e?.message ?? "Error al cargar las respuestas del proveedor");
      } finally {
        if (!cancelado) setCargandoPedidos(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const normalizarEstado = React.useCallback((estado?: string | null) => (estado ?? "").toLowerCase().trim(), []);

  const estaDisponible = React.useCallback(
    (producto: Producto) => {
      const estado = normalizarEstado(producto.estados);
      if (!estado) return false;
      if (estado.includes("no disponible")) return false;
      if (estado.includes("inactivo")) return false;
      return estado.includes("disponible");
    },
    [normalizarEstado]
  );

  const productosNoDisponibles = React.useMemo(
    () =>
      productos.filter((producto) => {
        const estado = normalizarEstado(producto.estados);
        return estado.includes("no disponible");
      }),
    [productos, normalizarEstado]
  );

  const agotados = React.useMemo(
    () =>
      productos.filter((producto) => {
        if (!estaDisponible(producto)) {
          return false;
        }
        const stock = Number(producto.stock);
        if (!Number.isFinite(stock)) {
          return false;
        }
        return stock <= 0;
      }),
    [productos, estaDisponible]
  );

  const stockBajo = React.useMemo(
    () =>
      productos.filter((producto) => {
        if (!estaDisponible(producto)) {
          return false;
        }
        const stock = Number(producto.stock);
        if (!Number.isFinite(stock)) {
          return false;
        }
        return stock > 0 && stock < 20;
      }),
    [productos, estaDisponible]
  );

  const productosPorId = React.useMemo(() => {
    const map = new Map<number, Producto>();
    productos.forEach((producto) => {
      map.set(producto.id, producto);
    });
    return map;
  }, [productos]);

  const pedidosAceptados = React.useMemo(
    () => pedidosProveedor.filter((pedido) => (pedido.estado ?? "").toLowerCase() === "aceptado"),
    [pedidosProveedor]
  );

  const pedidosRechazados = React.useMemo(
    () => pedidosProveedor.filter((pedido) => (pedido.estado ?? "").toLowerCase() === "rechazado"),
    [pedidosProveedor]
  );

  const alertasStock = React.useMemo(() => {
    const alertas: Array<{
      id: string;
      producto: Producto;
      tipo: "agotado" | "stock-bajo";
      prioridad: number;
      titulo: string;
      mensaje: string;
    }> = [];

    productos.forEach((producto) => {
      if (!estaDisponible(producto)) {
        return;
      }
      const stock = Number(producto.stock);
      if (!Number.isFinite(stock)) {
        return;
      }

      if (stock <= 0) {
        alertas.push({
          id: `${producto.id}-agotado`,
          producto,
          tipo: "agotado",
          prioridad: 1,
          titulo: `Producto agotado: ${producto.nombre}`,
          mensaje: "Stock en cero. Solicita un pedido al proveedor cuanto antes.",
        });
        return;
      }

      if (stock < 20) {
        alertas.push({
          id: `${producto.id}-bajo`,
          producto,
          tipo: "stock-bajo",
          prioridad: 2,
          titulo: `Stock bajo: ${producto.nombre}`,
          mensaje: "El inventario esta por debajo del nivel recomendado.",
        });
      }
    });

    return alertas.sort((a, b) => {
      if (a.prioridad !== b.prioridad) {
        return a.prioridad - b.prioridad;
      }
      const stockA = Number(a.producto.stock);
      const stockB = Number(b.producto.stock);
      if (stockA !== stockB) {
        return stockA - stockB;
      }
      return normalizarEstado(a.producto.nombre).localeCompare(normalizarEstado(b.producto.nombre));
    });
  }, [productos, normalizarEstado, estaDisponible]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-3xl border border-gray-200 bg-white/90 px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-500">
                <MdOutlineMarkEmailUnread className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-indigo-500">Notificaciones</p>
                <h1 className="text-3xl font-bold text-gray-900">Bandeja de alertas</h1>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-600">
              Controla alertas de inventario, pedidos del proveedor y nuevos productos sin perder el ritmo.
            </p>
          </div>
        </header>

        {!cargando && !error && (
          <section className="mb-6 rounded-2xl bg-white shadow">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2 text-gray-900">
                <MdOutlineMarkEmailUnread className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">Bandeja de alertas de inventario</h2>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {alertasStock.length} mensajes
              </span>
            </div>
            {alertasStock.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500">No hay alertas de inventario por ahora.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {alertasStock.map((alerta, index) => (
                  <li key={alerta.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 min-w-0 items-start gap-3">
                      <span
                        className={`mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full ${
                          alerta.tipo === "agotado" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {alerta.tipo === "agotado" ? <BiAngry className="h-5 w-5" /> : <MdWarningAmber className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{alerta.titulo}</p>
                        <p className="mt-1 text-sm text-gray-600">{alerta.mensaje}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          Stock actual: <strong>{alerta.producto.stock}</strong> &middot;{" "}
                          {alerta.producto.categoria ?? "Sin categoria"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {cargando && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            <FaSpinner className="h-4 w-4 animate-spin" />
            <span>Cargando notificaciones...</span>
          </div>
        )}

        {!cargando && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="space-y-6">

            <section className="rounded-2xl bg-white p-5 shadow">
              <div className="mb-3 flex items-center gap-2 text-green-600">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                  ✅
                </span>
                <h2 className="text-lg font-semibold">Pedidos aceptados por el proveedor</h2>
              </div>
              {cargandoPedidos ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  <span>Cargando respuestas...</span>
                </div>
              ) : errorPedidos ? (
                <p className="text-sm text-red-600">{errorPedidos}</p>
              ) : pedidosAceptados.length === 0 ? (
                <p className="text-sm text-gray-500">No hay pedidos aceptados recientemente.</p>
              ) : (
                <ul className="space-y-3">
                  {pedidosAceptados.map((pedido) => {
                    const productoPedido = productosPorId.get(pedido.producto_id);
                    return (
                      <li
                        key={pedido.id}
                        className="flex flex-col rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            Pedido #{pedido.id} &middot; Cantidad solicitada: {pedido.cantidad}
                          </p>
                          <p className="text-xs text-green-800">
                            Producto solicitado:{" "}
                            <strong>{productoPedido ? productoPedido.nombre : `ID ${pedido.producto_id}`}</strong>
                          </p>
                          <p className="text-xs text-green-800">
                            {pedido.descripcion
                              ? `Nota del proveedor: ${pedido.descripcion}`
                              : "El proveedor acepto la solicitud y aumentara el stock."}
                          </p>
                        </div>
                        <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase text-green-700 sm:mt-0">
                          Aceptado
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow">
              <div className="mb-3 flex items-center gap-2 text-red-600">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700">
                  ❌
                </span>
                <h2 className="text-lg font-semibold">Pedidos rechazados por el proveedor</h2>
              </div>
              {cargandoPedidos ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  <span>Cargando respuestas...</span>
                </div>
              ) : errorPedidos ? (
                <p className="text-sm text-red-600">{errorPedidos}</p>
              ) : pedidosRechazados.length === 0 ? (
                <p className="text-sm text-gray-500">No hay pedidos rechazados.</p>
              ) : (
                <ul className="space-y-3">
                  {pedidosRechazados.map((pedido) => {
                    const productoPedido = productosPorId.get(pedido.producto_id);
                    return (
                      <li
                        key={pedido.id}
                        className="flex flex-col rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            Pedido #{pedido.id} &middot; Cantidad solicitada: {pedido.cantidad}
                          </p>
                          <p className="text-xs text-red-800">
                            Producto solicitado:{" "}
                            <strong>{productoPedido ? productoPedido.nombre : `ID ${pedido.producto_id}`}</strong>
                          </p>
                          <p className="text-xs text-red-800">
                            {pedido.descripcion
                              ? `Motivo: ${pedido.descripcion}`
                              : "El proveedor no puede surtir este pedido por ahora."}
                          </p>
                        </div>
                        <span className="mt-2 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-700 sm:mt-0">
                          Rechazado
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow">
              <div className="mb-3 flex items-center gap-2 text-blue-600">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  🆕
                </span>
                <h2 className="text-lg font-semibold">Hay Productos nuevos para la venta</h2>
              </div>
              {productosNoDisponibles.length === 0 ? (
                <p className="text-sm text-gray-500">No hay nuevos productos</p>
              ) : (
                <ul className="space-y-3">
                  {productosNoDisponibles.map((producto) => (
                    <li
                      key={producto.id}
                      className="flex flex-col rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          {producto.nombre}{" "}
                          <span className="text-xs font-medium text-gray-500">
                            {producto.categoria ?? "Sin categoría"}
                          </span>
                        </p>
                        <p className="text-xs text-blue-800">
                          Revisa si es necesario incorporarlo pronto a la tienda.
                        </p>
                      </div>
                      <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700 sm:mt-0">
                        Nuevo producto
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

          </div>
        )}
      </div>
    </main>
  );
}