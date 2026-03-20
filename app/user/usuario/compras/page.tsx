"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  activo: boolean;
};

type UsuarioDetalle = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string | null;
  documento: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
};

type DetallePedido = {
  id: number;
  productoId: number;
  cantidad: number;
  precioProducto: number;
  subtotal: number;
  idUsuario: number | null;
  estado: string | null;
  fechaPago: string | null;
  nombreCliente: string | null;
  direccionCliente: string | null;
  telefonoCliente: string | null;
};

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  imagen: string | null;
  descripcion: string | null;
  estados: string | null;
};

type ItemCarrito = {
  detalle: DetallePedido;
  producto: Producto | null;
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const placeholderImagen = "/no-image.png";

export default function Page() {
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null);
  const [detalleUsuario, setDetalleUsuario] = useState<UsuarioDetalle | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [pedidosUsuario, setPedidosUsuario] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [accionExito, setAccionExito] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [vaciando, setVaciando] = useState(false);
  const [confirmandoPedido, setConfirmandoPedido] = useState(false);
  const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);
  const [medioPago, setMedioPago] = useState<"efectivo" | "tarjeta">("efectivo");

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
    });
    const payload: { ok: boolean; data?: unknown; error?: string } | null = await response
      .json()
      .catch(() => null);
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error ?? `Error ${response.status}`);
    }
    return payload.data as T;
  }, []);

  const loadData = useCallback(async () => {
    setCargando(true);
    setError(null);
    setAccionError(null);
     setAccionExito(null);
     setModalPedidoAbierto(false);
    try {
      const usuarios = await fetchJson<Usuario[]>("/api/usuarios");
      const activo = usuarios.find((usuario) => usuario.activo);
      if (!activo) {
        setUsuarioActivo(null);
        setDetalleUsuario(null);
        setPedidosUsuario([]);
        setCarrito([]);
        setError("No existe un usuario activo en este momento.");
        return;
      }
      setUsuarioActivo(activo);
      try {
        const informacion = await fetchJson<UsuarioDetalle>(`/api/usuarios/${activo.id}`);
        setDetalleUsuario(informacion);
      } catch (infoError) {
        console.warn("[Carrito] no se obtuvo informacion detallada del usuario", infoError);
        setDetalleUsuario(null);
      }

      const detalles = await fetchJson<DetallePedido[]>("/api/Detallepedido");
      const propios = detalles.filter((detalle) => Number(detalle.idUsuario) === activo.id);

      if (propios.length === 0) {
        setPedidosUsuario([]);
        setCarrito([]);
        return;
      }

      const uniqueIds = Array.from(new Set(propios.map((detalle) => detalle.productoId)));
      const productosPairs = await Promise.all(
        uniqueIds.map(async (productoId) => {
          try {
            const producto = await fetchJson<Producto>(`/api/productos/${productoId}`);
            return [productoId, producto] as const;
          } catch (productoError) {
            console.warn(`[Carrito] No se pudo cargar el producto ${productoId}`, productoError);
            return [productoId, null] as const;
          }
        })
      );

      const productosMap = new Map<number, Producto | null>(productosPairs);

      const items = propios.map((detalle) => ({
        detalle,
        producto: productosMap.get(detalle.productoId) ?? null,
      }));

      setPedidosUsuario(items);

      setCarrito(
        items.filter((item) => (item.detalle.estado ?? "Pendiente").toLowerCase() === "pendiente")
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Ocurrio un error al cargar el carrito."
      );
      setUsuarioActivo(null);
      setDetalleUsuario(null);
      setPedidosUsuario([]);
      setCarrito([]);
    } finally {
      setCargando(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const ajustarStock = useCallback(
    async (productoId: number, cantidad: number, operacion: "incrementar" | "disminuir") => {
      await fetchJson<{ stock: number }>(`/api/productos/${productoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "ajustar_stock",
          cantidad,
          operacion,
        }),
      });
    },
    [fetchJson]
  );

  const ejecutarBorrado = useCallback(
    async (item: ItemCarrito) => {
      await ajustarStock(item.detalle.productoId, item.detalle.cantidad, "incrementar");
      try {
        await fetchJson<{ id: number }>(`/api/Detallepedido/${item.detalle.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        await ajustarStock(item.detalle.productoId, item.detalle.cantidad, "disminuir").catch(
          () => undefined
        );
        throw err;
      }
    },
    [ajustarStock, fetchJson]
  );

  const eliminarProducto = useCallback(
    async (item: ItemCarrito) => {
      setAccionError(null);
      setEliminandoId(item.detalle.id);
      try {
        await ejecutarBorrado(item);
        setCarrito((prev) => prev.filter((fila) => fila.detalle.id !== item.detalle.id));
        setPedidosUsuario((prev) => prev.filter((fila) => fila.detalle.id !== item.detalle.id));
      } catch (err) {
        setAccionError(
          err instanceof Error
            ? err.message
            : "No se pudo eliminar el producto del carrito. Intenta nuevamente."
        );
      } finally {
        setEliminandoId(null);
      }
    },
    [ejecutarBorrado]
  );

  const vaciarCarrito = useCallback(async () => {
    if (carrito.length === 0) {
      return;
    }
    setVaciando(true);
    setAccionError(null);
    const procesados = new Set(carrito.map((item) => item.detalle.id));
    const pendientes: ItemCarrito[] = [];
    for (const item of carrito) {
      try {
        await ejecutarBorrado(item);
      } catch (err) {
        pendientes.push(item);
        setAccionError("No se pudieron eliminar todos los productos. Revisa tu conexion e intenta nuevamente.");
      }
    }
    setCarrito(pendientes);
    const pendientesIds = new Set(pendientes.map((item) => item.detalle.id));
    setPedidosUsuario((prev) =>
      prev.filter((item) => !procesados.has(item.detalle.id) || pendientesIds.has(item.detalle.id))
    );
    setVaciando(false);
  }, [carrito, ejecutarBorrado]);

  const resumen = useMemo(() => {
    const totalProductos = carrito.reduce((acc, item) => acc + item.detalle.cantidad, 0);
    const subtotal = carrito.reduce(
      (acc, item) => acc + item.detalle.precioProducto * item.detalle.cantidad,
      0
    );
    return { totalProductos, subtotal };
  }, [carrito]);

  const estadoResumen = carrito.length === 0 && !cargando ? "Tu carrito esta vacio." : null;

  const pedidosSeguimiento = useMemo(() => {
    if (!usuarioActivo) return [];
    return pedidosUsuario.filter((item) => {
      const mismoUsuario = Number(item.detalle.idUsuario) === Number(usuarioActivo.id);
      const estado = (item.detalle.estado ?? "").toLowerCase();
      return mismoUsuario && estado === "confirmado";
    });
  }, [pedidosUsuario, usuarioActivo]);

  const confirmarPedido = useCallback(async () => {
    if (carrito.length === 0 || confirmandoPedido) {
      return;
    }
    setAccionError(null);
    setAccionExito(null);
    setConfirmandoPedido(true);
    try {
      const idsPendientes = new Set(carrito.map((item) => item.detalle.id));
      await Promise.all(
        carrito.map((item) =>
          fetchJson<DetallePedido>(`/api/Detallepedido/${item.detalle.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "Confirmado" }),
          })
        )
      );
      setPedidosUsuario((prev) =>
        prev.map((item) =>
          idsPendientes.has(item.detalle.id)
            ? { ...item, detalle: { ...item.detalle, estado: "Confirmado" } }
            : item
        )
      );
      setCarrito((prev) => prev.filter((item) => !idsPendientes.has(item.detalle.id)));
      setAccionExito("Pedido confirmado correctamente.");
      setModalPedidoAbierto(true);
      setMedioPago("efectivo");
    } catch (err) {
      setAccionError(
        err instanceof Error ? err.message : "No se pudo confirmar el pedido. Intenta nuevamente."
      );
    } finally {
      setConfirmandoPedido(false);
    }
  }, [carrito, confirmandoPedido, fetchJson]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <section className="flex-1 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
                Carrito de Compras
              </h1>
              {usuarioActivo && (
                <p className="text-sm text-gray-500">
                  Compras de{" "}
                  <span className="font-semibold text-gray-700">
                    {usuarioActivo.nombre} {usuarioActivo.apellido}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void vaciarCarrito()}
                disabled={cargando || vaciando || carrito.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaTrash />
                Vaciar carrito
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {accionError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              {accionError}
            </div>
          )}
          {accionExito && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {accionExito}
            </div>
          )}

          {cargando ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                />
              ))}
            </div>
          ) : estadoResumen ? (
            <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-black/5">
              {estadoResumen}
            </div>
          ) : (
            <div className="space-y-4">
              {carrito.map((item) => {
                const imagen = item.producto?.imagen || placeholderImagen;
                const precioUnitario = formatoCOP.format(item.detalle.precioProducto);
                const subtotal = formatoCOP.format(
                  item.detalle.precioProducto * item.detalle.cantidad
                );
                return (
                  <article
                    key={item.detalle.id}
                    className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center justify-center rounded-xl bg-gray-100 p-2">
                      <Image
                        src={imagen}
                        alt={item.producto?.nombre ?? "Producto sin nombre"}
                        width={110}
                        height={140}
                        className="h-40 w-28 rounded-lg object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {item.producto?.nombre ?? "Producto sin nombre"}
                      </h2>

                      <p className="text-sm text-gray-500">
                        Categoria: {item.producto?.categoria ?? "Sin categoria"} | Estado del
                        producto: {item.producto?.estados ?? "Sin estado"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.detalle.fechaPago
                          ? `Fecha de pago: ${new Date(item.detalle.fechaPago).toLocaleDateString()}`
                          : "Pago pendiente"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">{precioUnitario}</p>
                        <p className="text-sm text-gray-500">
                          x {item.detalle.cantidad} unidad
                          {item.detalle.cantidad > 1 ? "es" : ""}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{subtotal}</p>
                      <button
                        type="button"
                        onClick={() => void eliminarProducto(item)}
                        disabled={eliminandoId === item.detalle.id || vaciando}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTrash />
                        {eliminandoId === item.detalle.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-xl font-semibold text-gray-900">Seguimiento de pedidos</h3>
            <p className="text-sm text-gray-500">
              Consulta tus productos confirmados para el envio.
            </p>
            {pedidosSeguimiento.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No hay pedidos en este momento.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {pedidosSeguimiento.map((item) => (
                  <li
                    key={`tracking-${item.detalle.id}`}
                    className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600"
                  >
                    <p className="font-semibold text-gray-900">
                      {item.producto?.nombre ?? "Producto sin nombre"}
                    </p>
                    <p className="mt-2">
                      Ultima actualizacion:{" "}
                      {item.detalle.fechaPago
                        ? new Date(item.detalle.fechaPago).toLocaleDateString()
                        : "En proceso"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Cantidad {item.detalle.cantidad}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="w-full lg:w-80">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-gray-900">Resumen del pedido</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Productos</span>
                <span>{resumen.totalProductos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatoCOP.format(resumen.subtotal)}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between text-xl font-bold text-gray-900">
                <span>Total a pagar</span>
                <span>{formatoCOP.format(resumen.subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void confirmarPedido()}
              disabled={carrito.length === 0 || confirmandoPedido}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmandoPedido ? "Confirmando..." : "Realizar pedido"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">
              Los precios no incluyen costos de envio.
            </p>
          </div>
        </aside>
      </div>

      {modalPedidoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-gray-800 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del envio</h2>
            <p className="mt-1 text-sm text-gray-500">
              Revisa tu informacion antes de finalizar.
            </p>

            <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Envio</p>
              <p className="text-sm text-gray-600">
                Direccion: {detalleUsuario?.direccion ?? "Sin direccion registrada"}
              </p>
              <p className="text-sm text-gray-600">
                Ciudad: {detalleUsuario?.ciudad ?? "Sin ciudad registrada"}
              </p>
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Tipo de pago</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {(["efectivo", "tarjeta"] as const).map((opcion) => (
                  <label
                    key={opcion}
                    className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      medioPago === opcion ? "border-sky-400 text-black" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="medioPago"
                      value={opcion}
                      checked={medioPago === opcion}
                      onChange={() => setMedioPago(opcion)}
                      className="h-4 w-4"
                    />
                    {opcion === "efectivo" ? "Efectivo" : "Tarjeta"}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalPedidoAbierto(false);
                  setAccionExito(null);
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalPedidoAbierto(false);
                  setAccionExito(null);
                }}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
