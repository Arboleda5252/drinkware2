"use client";

import * as React from "react";
import {
  FaSpinner,
  FaClipboardCheck,
  FaShoppingCart,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  pedidoId: number;
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  cantidad: number;
};

type UsuarioActivo = {
  id: number;
  nombre: string;
};

const currencyFormatter = new Intl.NumberFormat("es-CO");

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
  const [usuarioActivo, setUsuarioActivo] = React.useState<UsuarioActivo | null>(null);
  const [sesionCargada, setSesionCargada] = React.useState(false);
  const [pedidoActivoId, setPedidoActivoId] = React.useState<number | null>(null);
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
      } catch (e: unknown) {
        if (!cancelado) {
          setError(e instanceof Error ? e.message : "Error al cargar productos");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  React.useEffect(() => {
    setPagina(1);
  }, [busqueda, categoriaFiltro, precioMin, precioMax, orden]);

  React.useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch("/api/usuarioEstado", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelado) {
          if (!json?.ok) {
            setUsuarioActivo(null);
            return;
          }
          const usuario = json.user;
          if (usuario?.idusuario) {
            setUsuarioActivo({
              id: Number(usuario.idusuario),
              nombre: String(usuario.nombre ?? usuario.nombreusuario ?? ""),
            });
          } else {
            setUsuarioActivo(null);
          }
        }
      } catch (e) {
        if (!cancelado) {
          console.error("[Usuarios] no se pudo determinar la sesion activa", e);
          setUsuarioActivo(null);
        }
      } finally {
        if (!cancelado) {
          setSesionCargada(true);
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

  const crearPedido = React.useCallback(
    async (subtotal = 0) => {
      if (!usuarioActivo?.id) {
        return null;
      }

      try {
        const response = await fetch("/api/pedidos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idCliente: usuarioActivo.id,
            subtotal,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          const mensaje = payload?.error ?? response.statusText;
          console.error("[pedidos] no se pudo crear el pedido:", mensaje);
          return null;
        }

        return payload.data ?? null;
      } catch (error) {
        console.error("[pedidos] error al crear el pedido", error);
        return null;
      }
    },
    [usuarioActivo]
  );

  const actualizarPedido = React.useCallback(async (pedidoId: number, subtotal: number) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subtotal,
          costoEnvio: 0,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        const mensaje = payload?.error ?? response.statusText;
        console.error("[pedidos] no se pudo actualizar el pedido:", mensaje);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[pedidos] error al actualizar el pedido", error);
      return false;
    }
  }, []);

  const eliminarPedido = React.useCallback(async (pedidoId: number) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        const mensaje = payload?.error ?? response.statusText;
        console.error("[pedidos] no se pudo eliminar el pedido:", mensaje);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[pedidos] error al eliminar el pedido", error);
      return false;
    }
  }, []);

  const registrarDetallePedido = React.useCallback(
    async (pedidoId: number, producto: Producto, cantidad: number) => {
      try {
        const response = await fetch("/api/detalle_pedido", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idPedido: pedidoId,
            idProducto: producto.id,
            cantidad,
            precioUnitario: producto.precio,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          const mensaje = payload?.error ?? response.statusText;
          console.error("[detalle_pedido] no se pudo registrar el producto:", mensaje);
          return null;
        }
        return payload.data ?? null;
      } catch (error) {
        console.error("[detalle_pedido] error al registrar el producto", error);
        return null;
      }
    },
    []
  );

  const actualizarDetallePedido = React.useCallback(
    async (detalleId: number, cantidad: number, precio: number) => {
      try {
        const response = await fetch(`/api/detalle_pedido/${detalleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cantidad,
            precioUnitario: precio,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          const mensaje = payload?.error ?? response.statusText;
          console.error("[detalle_pedido] no se pudo actualizar:", mensaje);
          return false;
        }
        return true;
      } catch (error) {
        console.error("[detalle_pedido] error al actualizar el producto", error);
        return false;
      }
    },
    []
  );

  const eliminarDetallePedido = React.useCallback(async (detalleId: number) => {
    try {
      const response = await fetch(`/api/detalle_pedido/${detalleId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        const mensaje = payload?.error ?? response.statusText;
        console.error("[detalle_pedido] no se pudo eliminar:", mensaje);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[detalle_pedido] error al eliminar el producto", error);
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
    if (!usuarioActivo) {
      setMensajeCarrito("Necesitas iniciar sesión para continuar con la compra y añadir productos al carrito.");
      return false;
    }
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
        console.warn("[detalle_pedido] no se encontro detalleId para actualizar el producto");
        return false;
      }
      const actualizado = await actualizarDetallePedido(existente.detalleId, nuevaCantidad, producto.precio);
      if (!actualizado) return false;
      const stockAj = await ajustarStockProducto(producto.id, cantidadAgregada, "disminuir");
      if (stockAj === null) {
        await actualizarDetallePedido(existente.detalleId, existente.cantidad, producto.precio);
        return false;
      }
      const carritoActualizado = carrito.map((p) =>
        p.id === producto.id ? { ...p, cantidad: nuevaCantidad } : p
      );
      const subtotalActualizado = carritoActualizado.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );
      const pedidoActualizado = await actualizarPedido(existente.pedidoId, subtotalActualizado);
      if (!pedidoActualizado) {
        await ajustarStockProducto(producto.id, cantidadAgregada, "incrementar");
        await actualizarDetallePedido(existente.detalleId, existente.cantidad, producto.precio);
        return false;
      }
      setCarrito(carritoActualizado);
      agregado = true;
    } else {
      let pedidoId = pedidoActivoId;
      if (!pedidoId) {
        const pedido = await crearPedido(cantidadAgregada * producto.precio);
        const nuevoPedidoId = Number(pedido?.idPedido);
        if (!Number.isInteger(nuevoPedidoId) || nuevoPedidoId <= 0) {
          return false;
        }
        pedidoId = nuevoPedidoId;
        setPedidoActivoId(nuevoPedidoId);
      }

      const detalle = await registrarDetallePedido(pedidoId, producto, cantidadAgregada);
      const detalleId = Number(detalle?.idDetallePedido);
      if (!Number.isInteger(detalleId) || detalleId <= 0) {
        return false;
      }
      const stockAj = await ajustarStockProducto(producto.id, cantidadAgregada, "disminuir");
      if (stockAj === null) {
        await eliminarDetallePedido(detalleId);
        return false;
      }
      const carritoActualizado = [
        ...carrito,
        {
          detalleId,
          pedidoId,
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          cantidad: cantidadAgregada,
        },
      ];
      const subtotalActualizado = carritoActualizado.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );
      const pedidoActualizado = await actualizarPedido(pedidoId, subtotalActualizado);
      if (!pedidoActualizado) {
        await ajustarStockProducto(producto.id, cantidadAgregada, "incrementar");
        await eliminarDetallePedido(detalleId);
        if (carrito.length === 0) {
          await eliminarPedido(pedidoId);
          setPedidoActivoId(null);
        }
        return false;
      }
      setCarrito(carritoActualizado);
      agregado = true;
    }

    setCantidadesSeleccionadas((prev) => ({
      ...prev,
      [producto.id]: null,
    }));
    return agregado;
  };

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

    const carritoActualizado = carrito.filter((p) => p.id !== id);
    if (carritoActualizado.length === 0) {
      const pedidoEliminado = await eliminarPedido(item.pedidoId);
      if (!pedidoEliminado) {
        await ajustarStockProducto(id, item.cantidad, "disminuir");
        return;
      }
      setPedidoActivoId(null);
    } else {
      const subtotalActualizado = carritoActualizado.reduce(
        (acc, productoCarrito) => acc + productoCarrito.precio * productoCarrito.cantidad,
        0
      );
      const pedidoActualizado = await actualizarPedido(item.pedidoId, subtotalActualizado);
      if (!pedidoActualizado) {
        await ajustarStockProducto(id, item.cantidad, "disminuir");
        return;
      }
    }

    setCarrito(carritoActualizado);
  };

  const vaciarCarrito = async () => {
    const pendientes: ItemCarrito[] = [];
    const pedidoId = carrito[0]?.pedidoId ?? pedidoActivoId;
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
      if (pedidoId) {
        await eliminarPedido(pedidoId);
      }
      setPedidoActivoId(null);
    } else if (pedidoId) {
      const subtotalPendiente = pendientes.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );
      await actualizarPedido(pedidoId, subtotalPendiente);
    }
  };

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );
  const puedeAgregarAlCarrito = sesionCargada && !!usuarioActivo;
  const mensajeSesion = sesionCargada && !usuarioActivo
    ? "Por favor inicia sesión para poder agregar productos a tu carrito."
    : null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="bg-black py-3 text-gray-800 sm:py-10 lg:py-12">
      {/* BOTÓN DEL CARRITO */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setDrawerAbierto(true)}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-4 text-lg text-white shadow-lg transition hover:bg-sky-600"
        >
          <FaShoppingCart />
          <span>{carrito.length}</span>
        </button>
      </div>

      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-[#0b1220] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95" />

        <div className="relative z-10 mx-auto max-w-7xl px-1 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-8 sm:px-8">
            <h1 className="mt-3 text-center text-3xl font-extrabold italic tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Catálogo de productos 
            </h1>
          </div>

      {/* BÚSQUEDA */}
      <div className="mx-auto mb-6 max-w-3xl px-5 pt-6 sm:px-8">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Busca por nombre..."
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* FILTROS */}
      <div className="mb-10 grid gap-3 px-5 sm:grid-cols-2 sm:px-8 md:grid-cols-4">
        <select
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
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
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
        />

        <input
          type="number"
          min="0"
          placeholder="Precio maximo"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
        />

        <select
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-900"
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
      {mensajeSesion && (
        <div className="px-5 pb-6 sm:px-8">
          <div className="rounded-2xl px-5 py-4 text-right text-amber-700">
            {mensajeSesion}
          </div>
        </div>
      )}

      {cargando && (
        <div className="flex min-h-[240px] items-center justify-center px-5 text-xl text-sky-600 sm:px-8">
          <FaSpinner className="animate-spin mr-2" /> Cargando productos...
        </div>
      )}

      {error && (
        <div className="px-5 sm:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-red-600">
            {error}
          </div>
        </div>
      )}

      {!cargando && !error && productosFiltrados.length === 0 && (
        <div className="mx-5 mt-10 rounded-2xl border border-gray-200 bg-slate-50 p-10 text-center text-slate-600 sm:mx-8">
          No se encontraron productos.
        </div>
      )}

      {/* GRID DE PRODUCTOS (10 por página) */}
      <div className="grid gap-6 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:grid-cols-4">
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
              className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_20px_45px_rgba(2,6,23,0.35)] transition hover:-translate-y-1 hover:border-sky-300/30 hover:shadow-[0_26px_60px_rgba(2,6,23,0.5)]"
            >
              <div className="relative flex h-64 items-center justify-center border-b border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
                <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100 shadow-sm backdrop-blur-md">
                  {producto.categoria || "Sin categoría"}
                </span>
                <Image
                  src={producto.imagen || "/no-image.png"}
                  alt={producto.nombre}
                  width={220}
                  height={220}
                  className="h-56 w-auto object-contain"
                />

                <button
                  onClick={() => {
                    if (!sinStock && puedeAgregarAlCarrito) {
                      void agregarAlCarrito(producto, cantidadActual || 1);
                    }
                  }}
                  disabled={sinStock || !puedeAgregarAlCarrito}
                  className={`absolute right-4 top-4 rounded-full p-3 shadow-sm transition ${sinStock || !puedeAgregarAlCarrito ? "cursor-not-allowed bg-white/20 text-white/70" : "bg-sky-400 text-slate-950 hover:bg-sky-300"}`}
                >
                  <FaShoppingCart />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-5 text-center">
                <div className="flex flex-col items-center gap-3">
                  <h2 className="min-h-[4.5rem] max-w-[14rem] text-center text-xl font-semibold leading-snug text-white">
                    {producto.nombre}
                  </h2>

                  <div className="flex min-h-[5.5rem] w-full flex-col items-center justify-center space-y-2">
                    <p className="text-2xl font-bold tracking-tight text-white">
                      ${currencyFormatter.format(producto.precio)}
                    </p>
                    {sinStock ? (
                      <p className="text-sm text-center text-red-300">
                        Este producto no está disponible en este momento.
                      </p>
                    ) : (
                      <p className="text-sm text-center text-emerald-300">
                        Tenemos {stockDisponible} unidades listas.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <label className="flex flex-col text-sm font-medium text-slate-300">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
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
                      disabled={sinStock || !puedeAgregarAlCarrito}
                      className={`mt-2 w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-white shadow-sm outline-none focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/30 ${sinStock || !puedeAgregarAlCarrito ? "cursor-not-allowed bg-white/5" : "bg-white/10"}`}
                    />
                  </label>
                  {!sinStock && (cantidadSeleccionada ?? 0) > stockDisponible && (
                    <p className="text-center text-xs text-red-300">
                      La cantidad no puede superar el stock disponible ({stockDisponible}).
                    </p>
                  )}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    <span className="text-slate-300">Subtotal</span>
                    <span className="font-semibold text-white">
                      ${currencyFormatter.format(subtotalActual)}
                    </span>
                  </div>
                  <button
                    onClick={() => setModalProducto(producto)}
                    className="w-full rounded-xl bg-sky-400 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300"
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
      <div className="mt-10 flex flex-wrap justify-center gap-3 px-5 pb-8 sm:px-8">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina((p) => p - 1)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        {[...Array(totalPaginas)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPagina(i + 1)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              pagina === i + 1
                ? "bg-slate-900 text-white"
                : "border border-gray-200 bg-white text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-600"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={pagina === totalPaginas}
          onClick={() => setPagina((p) => p + 1)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
        </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODAL DETALLES */}
      {/* ========================================================= */}
      {modalProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            {/* Cerrar */}
            <button
              onClick={() => setModalProducto(null)}
              className="absolute right-5 top-5 text-slate-500 transition hover:text-slate-900"
            >
              <FaTimes size={22} />
            </button>

            <div className="flex flex-col items-center text-center">
              <Image
                src={modalProducto.imagen || "/no-image.png"}
                width={300}
                height={300}
                alt={modalProducto.nombre}
                className="mb-6 rounded-2xl bg-slate-50 object-contain"
              />

              <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
                {modalProducto.nombre}
              </h2>

              <p className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
                ${currencyFormatter.format(modalProducto.precio)}
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
                disabled={modalProducto.stock <= 0 || !puedeAgregarAlCarrito}
                className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-gray-300"
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
          className="fixed inset-0 z-40 bg-slate-950/45"
          onClick={() => setDrawerAbierto(false)}
        ></div>
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white p-6 shadow-xl transition-transform duration-300 ${
          drawerAbierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <FaShoppingCart /> Carrito
          </h2>
          <button
            onClick={() => setDrawerAbierto(false)}
            className="text-slate-500 transition hover:text-slate-900"
          >
            <FaTimes />
          </button>
        </div>

        {carrito.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-slate-50 p-8 text-center">
            <p className="text-slate-500">
              Tu carrito está vacío
            </p>
            {mensajeCarrito && (
              <p className="px-3 text-sm text-red-600">
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
            <ul className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              {carrito.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-3"
                >
                  <Image
                    src={item.imagen || "/no-image.png"}
                    alt={item.nombre}
                    width={60}
                    height={60}
                    className="rounded-xl bg-white object-contain"
                  />

                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                    <p className="text-sm text-gray-600">
                      ${currencyFormatter.format(item.precio)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-gray-200">
                        Cantidad: {item.cantidad}
                      </span>
                    </div>
                  </div>

                  <button
                    className="text-red-600 transition hover:text-red-700"
                    onClick={() => void eliminar(item.id)}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <p className="text-xl font-bold tracking-tight text-slate-900">
                Total: ${currencyFormatter.format(total)}
              </p>

              <button
                onClick={() => void vaciarCarrito()}
                className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Vaciar Carrito
              </button>

              <button
                onClick={() => {
                  setDrawerAbierto(false);
                  router.push("/user/usuario/compras");
                }}
                className="mt-3 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Finalizar compras
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
