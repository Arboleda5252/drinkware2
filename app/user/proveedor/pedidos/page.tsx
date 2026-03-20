"use client";

import * as React from "react";
import { FaSpinner, FaBan } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import Image from "next/image";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock: number;
  pedidos: boolean;
  estados: string | null;
  descripcion?: string | null;
  imagen?: string | null;
};

type ProductoDetalle = Producto & {
  descripcion: string | null;
  imagen: string | null;
  id_proveedor: number | null;
};

type PedidoProveedor = {
  id: number;
  producto_id: number;
  cantidad: number;
  estado: string;
  descripcion: string | null;
  creado_en: string;
};

const Search = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const MONEDA = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ProveedorPedidosPage() {
  const [query, setQuery] = React.useState("");
  const [filtroCategoria, setFiltroCategoria] = React.useState<string>("Todas");
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // modales y control de acciones
  const [modalPedidosAdminAbierto, setModalPedidosAdminAbierto] = React.useState(false);
  const [pedidosProveedor, setPedidosProveedor] = React.useState<PedidoProveedor[]>([]);
  const [cargandoPedidosProveedor, setCargandoPedidosProveedor] = React.useState(true);
  const [errorPedidosProveedor, setErrorPedidosProveedor] = React.useState<string | null>(null);
  const [errorSolicitudes, setErrorSolicitudes] = React.useState<string | null>(null);
  const [mensajeSolicitudes, setMensajeSolicitudes] = React.useState<string | null>(null);
  const [procesandoPedidoId, setProcesandoPedidoId] = React.useState<number | null>(null);
  const [notasPedidos, setNotasPedidos] = React.useState<Record<number, string>>({});
  const [modalPedidoAbierto, setModalPedidoAbierto] = React.useState(false);
  const [productoPedido, setProductoPedido] = React.useState<Producto | null>(null);
  const [cantidadPedido, setCantidadPedido] = React.useState<string>("");
  const [guardandoPedido, setGuardandoPedido] = React.useState(false);
  const [errorPedido, setErrorPedido] = React.useState<string | null>(null);
  const [exitoPedido, setExitoPedido] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setCargando(true);
        const res = await fetch("/api/productos", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "Respuesta invalida");
        if (!cancelado) setProductos(json.data as Producto[]);
      } catch (e: any) {
        if (!cancelado) setError(e?.message ?? "Error al cargar productos");
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
        setCargandoPedidosProveedor(true);
        const res = await fetch("/api/productos/productosPedidos", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "No fue posible cargar los pedidos");
        if (!cancelado) setPedidosProveedor(json.data as PedidoProveedor[]);
      } catch (e: any) {
        if (!cancelado) setErrorPedidosProveedor(e?.message ?? "Error al cargar las solicitudes");
      } finally {
        if (!cancelado) setCargandoPedidosProveedor(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const categorias = React.useMemo(() => {
    const set = new Set<string>(productos.map((p) => p.categoria ?? "Sin categoria"));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [productos]);

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const texto = [p.nombre ?? "", p.categoria ?? "Sin categoria", String(p.precio ?? ""), String(p.stock ?? "")]
        .join(" ")
        .toLowerCase();
      const coincideTexto = q ? texto.includes(q) : true;
      const coincideCat = filtroCategoria === "Todas" ? true : (p.categoria ?? "Sin categoria") === filtroCategoria;
      return coincideTexto && coincideCat;
    });
  }, [productos, query, filtroCategoria]);

  const productosPorId = React.useMemo(() => {
    const mapa = new Map<number, Producto>();
    productos.forEach((producto) => mapa.set(producto.id, producto));
    return mapa;
  }, [productos]);

  const pedidosAdministrador = React.useMemo(() => {
    return pedidosProveedor
      .filter((pedido) => (pedido.estado ?? "").toLowerCase() === "pendiente")
      .map((pedido) => {
        const producto = productosPorId.get(pedido.producto_id);
        if (!producto) return null;
        return { pedido, producto };
      })
      .filter((entrada): entrada is { pedido: PedidoProveedor; producto: Producto } => Boolean(entrada));
  }, [pedidosProveedor, productosPorId]);
  const totalProductos = React.useMemo(() => productos.length, [productos]);

  const abrirPedidosAdministrador = () => {
    setErrorSolicitudes(null);
    setMensajeSolicitudes(null);
    setModalPedidosAdminAbierto(true);
  };
  const cerrarPedidosAdministrador = () => {
    setModalPedidosAdminAbierto(false);
    setErrorSolicitudes(null);
    setMensajeSolicitudes(null);
    setProcesandoPedidoId(null);
  };

  const actualizarPedidoTrasAccion = (pedidoActualizado: PedidoProveedor, nuevoStock?: number) => {
    setPedidosProveedor((prev) =>
      prev.map((pedido) => (pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido))
    );
    setProductos((prev) =>
      prev.map((producto) => {
        if (producto.id !== pedidoActualizado.producto_id) return producto;
        return {
          ...producto,
          stock: nuevoStock !== undefined ? nuevoStock : producto.stock,
          pedidos: false,
        };
      })
    );
    setNotasPedidos((prev) => {
      if (!(pedidoActualizado.id in prev)) return prev;
      const { [pedidoActualizado.id]: _, ...resto } = prev;
      return resto;
    });
  };

  const procesarPedidoAdministrador = async (pedidoId: number, accion: "aceptar" | "rechazar") => {
    setProcesandoPedidoId(pedidoId);
    setErrorSolicitudes(null);
    setMensajeSolicitudes(null);
    try {
      const descripcion = notasPedidos[pedidoId] ?? null;
      const res = await fetch("/api/productos/productosPedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId, accion, descripcion }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      const pedidoActualizado = json?.data?.pedido as PedidoProveedor | undefined;
      if (!pedidoActualizado) {
        throw new Error("Respuesta inválida del servidor");
      }

      const nuevoStock: number | undefined = json?.data?.producto?.stock;
      actualizarPedidoTrasAccion(pedidoActualizado, accion === "aceptar" ? nuevoStock : undefined);
      setMensajeSolicitudes(
        accion === "aceptar"
          ? "Solicitud aceptada y stock actualizado."
          : "Solicitud rechazada correctamente."
      );
    } catch (e: any) {
      setErrorSolicitudes(e?.message ?? "No fue posible procesar la solicitud.");
    } finally {
      setProcesandoPedidoId(null);
    }
  };

  const enviarPedido = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productoPedido) return;
    const cantidad = Number(cantidadPedido);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setErrorPedido("Ingresa una cantidad mayor a cero.");
      return;
    }

    setGuardandoPedido(true);
    setErrorPedido(null);
    setExitoPedido(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setExitoPedido("Solicitud enviada");
      setCantidadPedido("");
    } catch (e: any) {
      setErrorPedido(e?.message ?? "No fue posible enviar la solicitud.");
    } finally {
      setGuardandoPedido(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {modalPedidosAdminAbierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-10">
          <div className="relative w-full max-w-5xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-center text-gray-900">Pedidos del Drinkware</h2>
                <p className="text-sm text-gray-500 py-2">Responder las solicitudes pendientes.</p>
              </div>
              <button
                type="button"
                onClick={cerrarPedidosAdministrador}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                X
              </button>
            </div>

            {errorPedidosProveedor && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorPedidosProveedor}
              </div>
            )}

            {errorSolicitudes && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorSolicitudes}
              </div>
            )}

            {mensajeSolicitudes && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {mensajeSolicitudes}
              </div>
            )}

            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {cargandoPedidosProveedor ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
                  <FaSpinner className="h-4 w-4 animate-spin" />
                  <span>Cargando solicitudes...</span>
                </div>
              ) : pedidosAdministrador.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-center text-gray-600">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Producto</th>
                      <th className="px-4 py-2 font-semibold">Categoria</th>
                      <th className="px-4 py-2 font-semibold">Precio</th>
                      <th className="px-4 py-2 font-semibold text-center">Cantidad</th>
                      <th className="px-4 py-2 font-semibold">Imagen</th>
                      <th className="px-4 py-2 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pedidosAdministrador.map(({ pedido, producto }) => {
                      const notaActual = notasPedidos[pedido.id] ?? "";
                      return (
                        <tr key={pedido.id} className="align-top hover:bg-gray-50">
                          <td className="px-4 py-2 text-center font-semibold text-gray-900">{producto.nombre}</td>
                          <td className="px-4 py-2">{producto.categoria ?? "Sin categoria"}</td>
                          <td className="px-4 py-2">{MONEDA.format(producto.precio)}</td>
                          <td className="px-4 py-2 text-center font-semibold text-gray-900">{pedido.cantidad}</td>
                          <td className="px-4 py-2">
                            {producto.imagen ? (
                              <div className="relative h-14 w-14 overflow-hidden rounded-md border border-gray-200">
                                <Image src={producto.imagen} alt={producto.nombre} fill className="object-cover" sizes="56px" />
                              </div>
                            ) : (
                              <span className="text-xs italic text-gray-400">Sin imagen</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase text-gray-400">Comentarios</p>
                                <p className="text-xs text-gray-600">
                                  {pedido.descripcion ? pedido.descripcion : ""}
                                </p>
                              </div>
                              <textarea
                                value={notaActual}
                                onChange={(event) =>
                                  setNotasPedidos((prev) => ({ ...prev, [pedido.id]: event.target.value }))
                                }
                                placeholder="Agrega una nota antes de responder"
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                rows={3}
                              />
                              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => procesarPedidoAdministrador(pedido.id, "rechazar")}
                                  disabled={procesandoPedidoId === pedido.id}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-70"
                                >
                                  {procesandoPedidoId === pedido.id ? (
                                    <FaSpinner className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FaBan className="h-4 w-4" />
                                  )}
                                  Rechazar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => procesarPedidoAdministrador(pedido.id, "aceptar")}
                                  disabled={procesandoPedidoId === pedido.id}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                                >
                                  {procesandoPedidoId === pedido.id ? (
                                    <FaSpinner className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MdEventAvailable className="h-4 w-4" />
                                  )}
                                  Aceptar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                  No hay pedidos pendientes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-center tracking-tight">Pedidos</h1>
        </header>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-start">
          <button
            type="button"
            onClick={abrirPedidosAdministrador}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Ver pedidos {pedidosAdministrador.length ? ` (${pedidosAdministrador.length})` : ""}
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, categoria"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm outline-none ring-0 focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-center font-semibold">Producto</th>
                  <th className="px-6 py-3 text-center font-semibold">Categoria</th>
                  <th className="px-6 py-3 text-center font-semibold">Precio</th>
                  <th className="px-6 py-3 text-center font-semibold">Descripcion</th>
                  <th className="px-6 py-3 text-center font-semibold">Imagen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargando && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-xl text-gray-500" />
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!cargando && error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                )}

                {!cargando &&
                  !error &&
                  filtrados.map((p) => {
                    const descripcion = p.descripcion
                      ? p.descripcion.length > 120
                        ? `${p.descripcion.slice(0, 120)}...`
                        : p.descripcion
                      : null;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60">
                        <td className="px-6 text-center py-3">{p.nombre}</td>
                        <td className="px-6 text-center py-3">{p.categoria ?? "Sin categoria"}</td>
                        <td className="px-6 text-center py-3">{MONEDA.format(p.precio)}</td>
                        <td className="px-6 text-center py-3">
                          {descripcion ? (
                            <span className="text-sm text-gray-600" title={p.descripcion ?? undefined}>
                              {descripcion}
                            </span>
                          ) : (
                            <span className="text-sm italic text-gray-400">Sin descripcion</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {p.imagen ? (
                            <div className="relative h-14 w-14 overflow-hidden rounded-md border border-gray-200">
                              <Image src={p.imagen} alt={p.nombre} fill className="object-cover" sizes="56px" />
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">Sin imagen</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!cargando && !error && filtrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No hay productos para "{query}".
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
        {!cargando && !error && (
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{filtrados.length}</span> de{" "}
            <span className="font-medium">{totalProductos}</span> productos.
          </p>
        )}
      </div>
    </main>
  );
}