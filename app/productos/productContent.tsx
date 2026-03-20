"use client";

import * as React from "react";
import {
  FaSpinner,
  FaClipboardCheck,
  FaBan,
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock: number;
  estado: string | null;
  descripcion: string | null;
  imagen: string | null;
};

type ProductoApi = Omit<Producto, "estado"> & {
  estados: string | null;
};

type ItemCarrito = {
  detalleId: number;
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  cantidad: number;
};

export default function Page() {
  const router = useRouter();

  // ------------------------
  // ESTADOS
  // ------------------------
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busqueda, setBusqueda] = React.useState("");

  // FILTROS
  const [categoriaFiltro, setCategoriaFiltro] = React.useState("");
  const [precioMin, setPrecioMin] = React.useState("");
  const [precioMax, setPrecioMax] = React.useState("");
  const [orden, setOrden] = React.useState("");

  // PAGINACION
  const [pagina, setPagina] = React.useState(1);
  const productosPorPagina = 8;

  // MODAL DETALLES
  const [modalProducto, setModalProducto] = React.useState<Producto | null>(null);

  // CARRITO
  const [carrito, setCarrito] = React.useState<ItemCarrito[]>([]);
  const [drawerAbierto, setDrawerAbierto] = React.useState(false);
  const [cantidadesSeleccionadas, setCantidadesSeleccionadas] = React.useState<
    Record<number, number | null>
  >({});
  const [usuarioActivo, setUsuarioActivo] = React.useState<{ id: number; nombre: string } | null>(null);
  const actualizarStockEnEstado = React.useCallback((productoId: number, nuevoStock: number) => {
    setProductos((prev) =>
      prev.map((producto) => (producto.id === productoId ? { ...producto, stock: nuevoStock } : producto))
    );
    setModalProducto((prev) => (prev?.id === productoId ? { ...prev, stock: nuevoStock } : prev));
  }, []);

  // ------------------------
  // CARGA DE PRODUCTOS
  // ------------------------
  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setCargando(true);
        const res = await fetch("/api/productos", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "Respuesta inválida");

        if (!cancelado) {
          const disponibles = (json.data as ProductoApi[])
            .filter(
              (producto) =>
                (producto.estados ?? "").toLowerCase() === "disponible"
            )
            .map(({ estados, ...producto }) => ({
              ...producto,
              estado: estados,
            }));

          setProductos(disponibles);
        }
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
        const res = await fetch("/api/usuarios", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "Respuesta invalida");
        const usuarios = Array.isArray(json.data) ? json.data : [];
        const activo = usuarios.find((u: any) => u?.activo === true);
        if (!cancelado) {
          setUsuarioActivo(activo ?? null);
        }
      } catch (e) {
        if (!cancelado) {
          console.error("[Usuarios] no se pudo determinar el usuario activo", e);
          setUsuarioActivo(null);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // ------------------------
  // FILTRADO DE PRODUCTOS
  // ------------------------
  const productosFiltrados = React.useMemo(() => {
    let lista = [...productos];

    const termino = busqueda.trim().toLowerCase();
    if (termino) {
      lista = lista.filter((p) =>
        p.nombre.toLowerCase().includes(termino)
      );
    }

    if (categoriaFiltro) {
      lista = lista.filter(
        (p) =>
          p.categoria?.toLowerCase() === categoriaFiltro.toLowerCase()
      );
    }

    if (precioMin) {
      const min = Number(precioMin);
      if (!Number.isNaN(min)) lista = lista.filter((p) => p.precio >= min);
    }

    if (precioMax) {
      const max = Number(precioMax);
      if (!Number.isNaN(max)) lista = lista.filter((p) => p.precio <= max);
    }

    if (orden === "nombre-asc") lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (orden === "nombre-desc") lista.sort((a, b) => b.nombre.localeCompare(a.nombre));
    if (orden === "precio-asc") lista.sort((a, b) => a.precio - b.precio);
    if (orden === "precio-desc") lista.sort((a, b) => b.precio - a.precio);

    return lista;
  }, [productos, busqueda, categoriaFiltro, precioMin, precioMax, orden]);

  const categorias = React.useMemo(() => {
    const set = new Set<string>();
    productos.forEach((p) => {
      const cat = p.categoria?.trim();
      if (cat) set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  // ------------------------
  // PAGINACIÓN
  // ------------------------
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const productosPagina = React.useMemo(() => {
    const inicio = (pagina - 1) * productosPorPagina;
    return productosFiltrados.slice(inicio, inicio + productosPorPagina);
  }, [productosFiltrados, pagina]);

  // =========================================================
  // MANEJO DE CARRITO
  // =========================================================

  const registrarDetallePedido = React.useCallback(
    async (producto: Producto, cantidad: number) => {
      const payload: Record<string, unknown> = {
        productoId: producto.id,
        cantidad,
        precioProducto: producto.precio,
        subtotal: cantidad * producto.precio,
      };

      if (usuarioActivo?.id) {
        payload.idUsuario = usuarioActivo.id;
      } else {
        console.warn("[Usuarios] no hay un usuario activo, se envia sin idUsuario");
      }

      try {
        const response = await fetch("/api/Detallepedido", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const payloadResp = await response.json().catch(() => null);
        if (!response.ok || !payloadResp?.ok) {
          const mensaje = payloadResp?.error ?? response.statusText;
          console.error("[Detallepedido] no se pudo registrar el producto:", mensaje);
          return null;
        }
        return payloadResp.data ?? null;
      } catch (error) {
        console.error("[Detallepedido] error al registrar el producto", error);
        return null;
      }
    },
    [usuarioActivo]
  );

  const actualizarDetallePedido = React.useCallback(
    async (detalleId: number, cantidad: number, precio: number) => {
      try {
        const response = await fetch(`/api/Detallepedido/${detalleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cantidad,
            precioProducto: precio,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          const mensaje = payload?.error ?? response.statusText;
          console.error("[Detallepedido] no se pudo actualizar:", mensaje);
          return false;
        }
        return true;
      } catch (error) {
        console.error("[Detallepedido] error al actualizar el producto", error);
        return false;
      }
    },
    []
  );

  const eliminarDetallePedido = React.useCallback(async (detalleId: number) => {
    try {
      const response = await fetch(`/api/Detallepedido/${detalleId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        const mensaje = payload?.error ?? response.statusText;
        console.error("[Detallepedido] no se pudo eliminar:", mensaje);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[Detallepedido] error al eliminar el producto", error);
      return false;
    }
  }, []);

  const ajustarStockProducto = React.useCallback(
    async (productoId: number, cantidad: number, operacion: "incrementar" | "disminuir") => {
      try {
        const response = await fetch(`/api/productos/${productoId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accion: "ajustar_stock",
            cantidad,
            operacion,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          const mensaje = payload?.error ?? response.statusText;
          console.error("[Productos] no se pudo ajustar el stock:", mensaje);
          return null;
        }
        const nuevoStock = Number(payload.data?.stock);
        if (!Number.isInteger(nuevoStock)) {
          console.error("[Productos] respuesta de stock invalida");
          return null;
        }
        actualizarStockEnEstado(productoId, nuevoStock);
        return nuevoStock;
      } catch (error) {
        console.error("[Productos] error al ajustar el stock", error);
        return null;
      }
    },
    [actualizarStockEnEstado]
  );

  const [mensajeCarrito, setMensajeCarrito] = React.useState<string | null>(null);

  const agregarAlCarrito = async (producto: Producto, cantidad = 1): Promise<boolean> => {
    setMensajeCarrito(null);
    const cantidadAgregada = Math.max(1, Number(cantidad) || 1);
    const stockDisponible = productos.find((p) => p.id === producto.id)?.stock ?? producto.stock;
    if (cantidadAgregada > stockDisponible) {
      setMensajeCarrito("Producto no disponible en este momento. Estamos trabajando para tenerlo de nuevo pronto.");
      console.error("[Productos] stock insuficiente para agregar al carrito");
      return false;
    }

    const existente = carrito.find((p) => p.id === producto.id);
    let agregado = false;

    if (existente) {
      const nuevaCantidad = existente.cantidad + cantidadAgregada;
      if (!existente.detalleId) {
        console.warn("[Detallepedido] no se encontro detalleId para actualizar el producto");
        return false;
      }
      const actualizado = await actualizarDetallePedido(existente.detalleId, nuevaCantidad, producto.precio);
      if (!actualizado) return false;
      const stockAj = await ajustarStockProducto(producto.id, cantidadAgregada, "disminuir");
      if (stockAj === null) {
        await actualizarDetallePedido(existente.detalleId, existente.cantidad, producto.precio);
        return false;
      }
      setCarrito((prev) =>
        prev.map((p) => (p.id === producto.id ? { ...p, cantidad: nuevaCantidad } : p))
      );
      agregado = true;
    } else {
      const detalle = await registrarDetallePedido(producto, cantidadAgregada);
      if (!detalle?.id) {
        return false;
      }
      const stockAj = await ajustarStockProducto(producto.id, cantidadAgregada, "disminuir");
      if (stockAj === null) {
        await eliminarDetallePedido(Number(detalle.id));
        return false;
      }
      const detalleId = Number(detalle.id);
      setCarrito((prev) => [
        ...prev,
        {
          detalleId,
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          cantidad: cantidadAgregada,
        },
      ]);
      agregado = true;
    }

    setCantidadesSeleccionadas((prev) => ({
      ...prev,
      [producto.id]: null,
    }));
    return agregado;
  };

  const aumentar = (_id: number) => {};

  const disminuir = (_id: number) => {};

  const eliminar = async (id: number) => {
    const item = carrito.find((p) => p.id === id);
    if (!item) return;

    const stockAj = await ajustarStockProducto(id, item.cantidad, "incrementar");
    if (stockAj === null) {
      return;
    }

    if (item.detalleId) {
      const eliminado = await eliminarDetallePedido(item.detalleId);
      if (!eliminado) {
        await ajustarStockProducto(id, item.cantidad, "disminuir");
        return;
      }
    }

    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  const vaciarCarrito = async () => {
    const pendientes: ItemCarrito[] = [];
    for (const item of carrito) {
      const stockAj = await ajustarStockProducto(item.id, item.cantidad, "incrementar");
      if (stockAj === null) {
        pendientes.push(item);
        continue;
      }
      if (item.detalleId) {
        const eliminado = await eliminarDetallePedido(item.detalleId);
        if (!eliminado) {
          await ajustarStockProducto(item.id, item.cantidad, "disminuir");
          pendientes.push(item);
          continue;
        }
      }
    }
    setCarrito(pendientes);
    if (pendientes.length === 0) {
      setCantidadesSeleccionadas({});
    }
  };

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      {/* BOTÓN DEL CARRITO */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setDrawerAbierto(true)}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 flex items-center gap-2 text-lg"
        >
          <FaShoppingCart />
          <span>{carrito.length}</span>
        </button>
      </div>

      <h1 className="text-5xl font-bold text-center text-indigo-700 mb-8">
        Catálogo de Productos
      </h1>

      {/* BÚSQUEDA */}
      <div className="mx-auto mb-8 max-w-xl">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Busca por nombre..."
          className="w-full rounded-lg border px-4 py-2 shadow-sm"
        />
      </div>

      {/* FILTROS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-10">
        <select
          className="p-2 border rounded"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
        >
          <option value="">Categoria</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Precio minimo"
          className="p-2 border rounded"
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
        />

        <input
          type="number"
          min="0"
          placeholder="Precio maximo"
          className="p-2 border rounded"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
        />

        <select
          className="p-2 border rounded"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
        >
          <option value="">Ordenar</option>
          <option value="nombre-asc">A - Z</option>
          <option value="nombre-desc">Z - A</option>
          <option value="precio-asc">Precio menor a mayor</option>
          <option value="precio-desc">Precio mayor a menor</option>
        </select>
      </div>

      {/* MENSAJES */}
      {cargando && (
        <div className="flex justify-center items-center text-purple-600 text-xl">
          <FaSpinner className="animate-spin mr-2" /> Cargando productos...
        </div>
      )}

      {error && <div className="text-center text-red-600">{error}</div>}

      {!cargando && !error && productosFiltrados.length === 0 && (
        <div className="text-center text-gray-600 text-xl mt-10 border p-6 rounded-lg bg-white">
          No se encontraron productos.
        </div>
      )}

      {/* GRID DE PRODUCTOS (10 por página) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {productosPagina.map((producto) => {
          const stockDisponible = producto.stock;
          const sinStock = stockDisponible <= 0;
          const cantidadSeleccionada = cantidadesSeleccionadas[producto.id];
          const cantidadActual = sinStock
            ? 0
            : Math.min(cantidadSeleccionada ?? 0, stockDisponible);
          const subtotalActual = cantidadActual * producto.precio;
          return (
            <div
              key={producto.id}
              className="bg-white rounded-xl shadow-md overflow-hidden text-center flex flex-col h-full"
            >
              <div className="relative bg-gray-50 h-64 flex items-center justify-center">
                <Image
                  src={producto.imagen || "/no-image.png"}
                  alt={producto.nombre}
                  width={220}
                  height={220}
                  className="h-56 w-auto object-contain"
                />

                <button
                  onClick={() => {
                    if (!sinStock) {
                      void agregarAlCarrito(producto, cantidadActual || 1);
                    }
                  }}
                  disabled={sinStock}
                  className={`absolute top-2 right-2 p-2 rounded-full ${sinStock ? "bg-gray-400 text-white cursor-not-allowed" : "bg-black text-white"}`}
                >
                  <FaShoppingCart />
                </button>
              </div>

              <div className="p-4 flex flex-col flex-1 gap-3 text-left">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-semibold text-gray-800 text-center min-h-[3.5rem] flex items-center justify-center">
                    {producto.nombre}
                  </h2>

                  <div className="text-center space-y-1 min-h-[4.5rem] flex flex-col justify-center">
                    <p className="text-lg font-semibold text-slate-700">
                      Precio unitario: ${producto.precio.toLocaleString("es-CO")}
                    </p>
                    {sinStock ? (
                      <p className="text-sm font-semibold text-red-600">
                        Este producto no está disponible en este momento.
                      </p>
                    ) : (
                      <p className="text-sm text-green-800">
                        Tenemos {stockDisponible} unidades listas para que lo compres.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">
                    Cantidad
                    <input
                      type="number"
                      min="1"
                      max={Math.max(stockDisponible, 1)}
                      value={
                        sinStock ? "" : cantidadSeleccionada?.toString() ?? ""
                      }
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor === "") {
                          setCantidadesSeleccionadas((prev) => ({
                            ...prev,
                            [producto.id]: null,
                          }));
                          return;
                        }
                        const numero = Number(valor);
                        if (Number.isNaN(numero)) {
                          return;
                        }
                        const minimo = Math.max(1, numero);
                        const limite = Math.min(minimo, Math.max(stockDisponible, 1));
                        setCantidadesSeleccionadas((prev) => ({
                          ...prev,
                          [producto.id]: limite,
                        }));
                      }}
                      disabled={sinStock}
                      className={`mt-1 w-full rounded border px-3 py-1 ${sinStock ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                  </label>
                  {!sinStock && (cantidadSeleccionada ?? 0) > stockDisponible && (
                    <p className="text-xs text-red-600">
                      La cantidad no puede superar el stock disponible ({stockDisponible}).
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
                    Subtotal: ${subtotalActual.toLocaleString("es-CO")}
                  </p>
                  <button
                    onClick={() => setModalProducto(producto)}
                    className="w-full bg-black text-white py-2 rounded transition-colors hover:bg-sky-500"
                  >
                    <FaClipboardCheck className="inline mr-2" /> Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center gap-3 mt-10">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina((p) => p - 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-40"
        >
          Anterior
        </button>

        {[...Array(totalPaginas)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPagina(i + 1)}
            className={`px-4 py-2 rounded ${
              pagina === i + 1
                ? "bg-black text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={pagina === totalPaginas}
          onClick={() => setPagina((p) => p + 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODAL DETALLES */}
      {/* ========================================================= */}
      {modalProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white w-[90%] md:w-[600px] rounded-xl shadow-xl p-6 relative">
            {/* Cerrar */}
            <button
              onClick={() => setModalProducto(null)}
              className="absolute top-4 right-4 text-gray-700 hover:text-black"
            >
              <FaTimes size={22} />
            </button>

            <div className="flex flex-col items-center">
              <Image
                src={modalProducto.imagen || "/no-image.png"}
                width={300}
                height={300}
                alt={modalProducto.nombre}
                className="rounded-lg mb-4"
              />

              <h2 className="text-3xl font-bold text-indigo-600 mb-3">
                {modalProducto.nombre}
              </h2>

              <p className="text-lg text-gray-700 mb-2">
                <strong>Precio:</strong> ${modalProducto.precio.toLocaleString("es-CO")}
              </p>

              <p className="text-lg text-gray-700 mb-2">
                <strong>Categoría:</strong> {modalProducto.categoria}
              </p>

              <p className="text-lg text-gray-700 mb-2">
                <strong>Stock:</strong> {modalProducto.stock}
              </p>

              <p className="text-lg text-gray-700 mb-4">
                <strong>Descripción:</strong> {modalProducto.descripcion}
              </p>

              <button
                onClick={async () => {
                  const cantidadModal = cantidadesSeleccionadas[modalProducto.id] ?? 1;
                  const agregado = await agregarAlCarrito(modalProducto, cantidadModal);
                  if (agregado) {
                    setModalProducto(null);
                  }
                }}
                className="mt-4 bg-black text-white px-6 py-2 rounded-lg"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER CARRITO */}
      {/* ========================================================= */}
      {drawerAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setDrawerAbierto(false)}
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl p-6 z-50 transform transition-transform duration-300 ${
          drawerAbierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaShoppingCart /> Carrito
        </h2>

        {carrito.length === 0 ? (
          <div className="text-center mt-10 space-y-2">
            <p className="text-gray-500">
              Tu carrito está vacío
            </p>
            {mensajeCarrito && (
              <p className="text-sm text-red-600 px-3">
                {mensajeCarrito}
              </p>
            )}
          </div>
        ) : (
          <>
            {mensajeCarrito && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {mensajeCarrito}
              </div>
            )}
            <ul className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
              {carrito.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b pb-3"
                >
                  <Image
                    src={item.imagen || "/no-image.png"}
                    alt={item.nombre}
                    width={60}
                    height={60}
                    className="rounded"
                  />

                  <div className="flex-1">
                    <p className="font-semibold">{item.nombre}</p>
                    <p className="text-sm text-gray-600">
                      ${item.precio.toLocaleString("es-CO")}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 rounded bg-gray-100">
                        Cantidad: {item.cantidad}
                      </span>
                    </div>
                  </div>

                  <button
                    className="text-red-600"
                    onClick={() => void eliminar(item.id)}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <p className="text-xl font-bold">
                Total: ${total.toLocaleString("es-CO")}
              </p>

              <button
                onClick={() => void vaciarCarrito()}
                className="mt-4 w-full bg-red-600 text-white py-2 rounded"
              >
                Vaciar Carrito
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}