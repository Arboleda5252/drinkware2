"use client";

import * as React from "react";
import { FaSpinner, FaClipboardCheck, FaBan, FaSave } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import Image from "next/image";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio: number;
  precio_base: number;
  iva_porcentaje: number;
  subida_porcentaje: number;
  precio_cliente: number;
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

const ICON = "h-4 w-4";

const Eye = () => (
  <svg className={ICON} viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const Search = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const overlayClass =
  "fixed inset-0 z-50 flex justify-center bg-slate-950/75 px-4 backdrop-blur-sm";
const modalClass =
  "relative rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]";
const closeButtonClass =
  "absolute right-4 top-4 rounded-full border border-white/10 px-3 py-1 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white";
const panelClass =
  "rounded-[2rem] border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md";
const actionButtonClass =
  "rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 transition hover:border-sky-300/30 hover:bg-white/10 hover:text-white disabled:opacity-50";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ProductsPage() {
  const [query, setQuery] = React.useState("");
  const [filtroCategoria, setFiltroCategoria] = React.useState<string>("Todas");
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [modalVerAbierto, setModalVerAbierto] = React.useState(false);
  const [productoVer, setProductoVer] = React.useState<ProductoDetalle | null>(null);
  const [modalInactivarAbierto, setModalInactivarAbierto] = React.useState(false);
  const [productoInactivar, setProductoInactivar] = React.useState<Producto | null>(null);
  const [guardandoInactivar, setGuardandoInactivar] = React.useState(false);
  const [errorInactivar, setErrorInactivar] = React.useState<string | null>(null);
  const [modalInactivosAbierto, setModalInactivosAbierto] = React.useState(false);
  const [modalNoDisponiblesAbierto, setModalNoDisponiblesAbierto] = React.useState(false);
  const [activandoId, setActivandoId] = React.useState<number | null>(null);
  const [errorActivar, setErrorActivar] = React.useState<string | null>(null);
  const [modalPedidoAbierto, setModalPedidoAbierto] = React.useState(false);
  const [productoPedido, setProductoPedido] = React.useState<Producto | null>(null);
  const [cantidadPedido, setCantidadPedido] = React.useState<string>("");
  const [guardandoPedido, setGuardandoPedido] = React.useState(false);
  const [errorPedido, setErrorPedido] = React.useState<string | null>(null);
  const [exitoPedido, setExitoPedido] = React.useState<string | null>(null);
  const [draftSubas, setDraftSubas] = React.useState<Record<number, string>>({});
  const [guardandoSubaId, setGuardandoSubaId] = React.useState<number | null>(null);
  const [errorSuba, setErrorSuba] = React.useState<string | null>(null);
  const [exitoSuba, setExitoSuba] = React.useState<string | null>(null);
  const [modalSubaCategoriaAbierto, setModalSubaCategoriaAbierto] = React.useState(false);
  const [categoriaSuba, setCategoriaSuba] = React.useState("");
  const [subaCategoriaValor, setSubaCategoriaValor] = React.useState("");
  const [guardandoSubaCategoria, setGuardandoSubaCategoria] = React.useState(false);
  const [errorSubaCategoria, setErrorSubaCategoria] = React.useState<string | null>(null);
  const [exitoSubaCategoria, setExitoSubaCategoria] = React.useState<string | null>(null);

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
      } catch (error: unknown) {
        if (!cancelado) setError(getErrorMessage(error, "Error al cargar productos"));
      } finally {
        if (!cancelado) setCargando(false);
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

  React.useEffect(() => {
    if (!categoriaSuba) {
      setCategoriaSuba(categorias.find((categoria) => categoria !== "Todas") ?? "");
    }
  }, [categoriaSuba, categorias]);

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos
      .filter((p) => (p.estados ?? "").toLowerCase() === "disponible")
      .filter((p) => {
        const texto = [
          p.nombre ?? "",
          p.categoria ?? "Sin categoria",
          String(p.precio_base ?? ""),
          String(p.stock ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        const coincideTexto = q ? texto.includes(q) : true;
        const coincideCat = filtroCategoria === "Todas" ? true : (p.categoria ?? "Sin categoria") === filtroCategoria;
        return coincideTexto && coincideCat;
      });
  }, [productos, query, filtroCategoria]);

  const inactivos = React.useMemo(
    () => productos.filter((p) => (p.estados ?? "").toLowerCase() === "inactivo"),
    [productos]
  );
  const noDisponibles = React.useMemo(
    () => productos.filter((p) => (p.estados ?? "").toLowerCase() === "no disponible"),
    [productos]
  );
  const totalDisponibles = React.useMemo(
    () => productos.filter((p) => (p.estados ?? "").toLowerCase() === "disponible").length,
    [productos]
  );

  const verProducto = async (p: Producto) => {
    setProductoVer(null);
    setModalVerAbierto(true);
    try {
      const res = await fetch(`/api/productos/${p.id}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.ok && json.data) {
        setProductoVer(json.data as ProductoDetalle);
      } else {
        setProductoVer({ ...p, descripcion: null, imagen: null, id_proveedor: null });
      }
    } catch {
      setProductoVer({ ...p, descripcion: null, imagen: null, id_proveedor: null });
    }
  };

  const cerrarModalVer = () => {
    setModalVerAbierto(false);
    setProductoVer(null);
  };

  const abrirInactivar = (p: Producto) => {
    setProductoInactivar(p);
    setErrorInactivar(null);
    setModalInactivarAbierto(true);
  };

  const cerrarInactivar = () => {
    setModalInactivarAbierto(false);
    setProductoInactivar(null);
    setGuardandoInactivar(false);
    setErrorInactivar(null);
  };

  const abrirModalInactivos = () => {
    setErrorActivar(null);
    setModalInactivosAbierto(true);
  };

  const cerrarModalInactivos = () => {
    setModalInactivosAbierto(false);
    setErrorActivar(null);
    setActivandoId(null);
  };

  const abrirModalNoDisponibles = () => {
    setErrorActivar(null);
    setModalNoDisponiblesAbierto(true);
  };

  const cerrarModalNoDisponibles = () => {
    setModalNoDisponiblesAbierto(false);
    setErrorActivar(null);
    setActivandoId(null);
  };

  const abrirModalPedido = (p: Producto) => {
    setProductoPedido(p);
    setCantidadPedido("");
    setErrorPedido(null);
    setExitoPedido(null);
    setModalPedidoAbierto(true);
  };

  const cerrarModalPedido = () => {
    setModalPedidoAbierto(false);
    setProductoPedido(null);
    setCantidadPedido("");
    setErrorPedido(null);
    setExitoPedido(null);
    setGuardandoPedido(false);
  };

  const enviarPedido = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productoPedido) return;

    const cantidad = Number(cantidadPedido);
    if (!Number.isFinite(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      setErrorPedido("Ingresa una cantidad entera mayor a cero.");
      return;
    }

    setGuardandoPedido(true);
    setErrorPedido(null);
    setExitoPedido(null);

    try {
      const res = await fetch(`/api/productos/${productoPedido.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "solicitar_pedido", cantidad }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      setProductos((prev) => prev.map((p) => (p.id === productoPedido.id ? { ...p, pedidos: true } : p)));
      setProductoPedido((prev) => (prev ? { ...prev, pedidos: true } : prev));

      setExitoPedido("Solicitud enviada");
      setCantidadPedido("");
    } catch (error: unknown) {
      setErrorPedido(getErrorMessage(error, "No fue posible enviar la solicitud."));
    } finally {
      setGuardandoPedido(false);
    }
  };

  const confirmarInactivar = async () => {
    if (!productoInactivar) return;
    setGuardandoInactivar(true);
    setErrorInactivar(null);
    try {
      const res = await fetch(`/api/productos/${productoInactivar.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "inactivar" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);

      setProductos((prev) =>
        prev.map((p) => (p.id === productoInactivar.id ? { ...p, estados: "Inactivo" } : p))
      );

      cerrarInactivar();
    } catch (error: unknown) {
      setErrorInactivar(getErrorMessage(error, "Error al descontinuar el producto"));
    } finally {
      setGuardandoInactivar(false);
    }
  };

  const activarProducto = async (producto: Producto) => {
    setErrorActivar(null);
    setActivandoId(producto.id);
    try {
      const res = await fetch(`/api/productos/${producto.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "activar" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, estados: "Disponible" } : p)));
    } catch (error: unknown) {
      setErrorActivar(getErrorMessage(error, "Error al activar el producto"));
    } finally {
      setActivandoId(null);
    }
  };

  const actualizarProductoEnEstado = React.useCallback((productoActualizado: Producto) => {
    setProductos((prev) =>
      prev.map((producto) =>
        producto.id === productoActualizado.id ? { ...producto, ...productoActualizado } : producto
      )
    );
    setProductoVer((prev) =>
      prev?.id === productoActualizado.id ? { ...prev, ...productoActualizado } : prev
    );
  }, []);

  const guardarSubaProducto = async (producto: Producto) => {
    const rawValue = draftSubas[producto.id] ?? String(producto.subida_porcentaje ?? 0);
    const subidaPorcentaje = Number(rawValue);

    if (!Number.isFinite(subidaPorcentaje) || subidaPorcentaje < 0) {
      setErrorSuba("La Ganancia debe ser un numero valido.");
      setExitoSuba(null);
      return;
    }

    setGuardandoSubaId(producto.id);
    setErrorSuba(null);
    setExitoSuba(null);

    try {
      const res = await fetch(`/api/productos/${producto.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "actualizar_porcentajes",
          suba: subidaPorcentaje,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.data) {
        throw new Error(json?.error ?? "No fue posible actualizar la Ganancia.");
      }

      actualizarProductoEnEstado(json.data as Producto);
      setDraftSubas((prev) => ({ ...prev, [producto.id]: String(subidaPorcentaje) }));
      setExitoSuba(`Ganancia actualizada para ${producto.nombre}.`);
    } catch (error: unknown) {
      setErrorSuba(getErrorMessage(error, "No fue posible actualizar la Ganancia."));
    } finally {
      setGuardandoSubaId(null);
    }
  };

  const abrirModalSubaCategoria = () => {
    setErrorSubaCategoria(null);
    setExitoSubaCategoria(null);
    setSubaCategoriaValor("");
    setCategoriaSuba(categorias.find((categoria) => categoria !== "Todas") ?? "");
    setModalSubaCategoriaAbierto(true);
  };

  const cerrarModalSubaCategoria = () => {
    setModalSubaCategoriaAbierto(false);
    setGuardandoSubaCategoria(false);
    setErrorSubaCategoria(null);
    setExitoSubaCategoria(null);
  };

  const guardarSubaPorCategoria = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subidaPorcentaje = Number(subaCategoriaValor);
    if (!categoriaSuba) {
      setErrorSubaCategoria("Selecciona una categoria.");
      setExitoSubaCategoria(null);
      return;
    }

    if (!Number.isFinite(subidaPorcentaje) || subidaPorcentaje < 0) {
      setErrorSubaCategoria("La Ganancia debe ser un numero valido.");
      setExitoSubaCategoria(null);
      return;
    }

    setGuardandoSubaCategoria(true);
    setErrorSubaCategoria(null);
    setExitoSubaCategoria(null);

    try {
      const res = await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "actualizar_suba_categoria",
          categoria: categoriaSuba,
          suba: subidaPorcentaje,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !Array.isArray(json?.data)) {
        throw new Error(json?.error ?? "No fue posible actualizar la Ganancia por categoria.");
      }

      const actualizados = new Map<number, Producto>(
        (json.data as Producto[]).map((producto) => [producto.id, producto])
      );

      setProductos((prev) =>
        prev.map((producto) => actualizados.get(producto.id) ?? producto)
      );
      setProductoVer((prev) => {
        if (!prev) return prev;
        const actualizado = actualizados.get(prev.id);
        return actualizado ? { ...prev, ...actualizado } : prev;
      });
      setDraftSubas((prev) => {
        const next = { ...prev };
        actualizados.forEach((producto) => {
          next[producto.id] = String(producto.subida_porcentaje ?? subidaPorcentaje);
        });
        return next;
      });
      setExitoSubaCategoria(
        `Margen de Ganancia actualizada a ${subidaPorcentaje}% para ${json?.updated ?? actualizados.size} producto(s).`
      );
    } catch (error: unknown) {
      setErrorSubaCategoria(
        getErrorMessage(error, "No fue posible actualizar la Ganancia por categoria.")
      );
    } finally {
      setGuardandoSubaCategoria(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      {modalSubaCategoriaAbierto && (
        <div className={`${overlayClass} items-center`}>
          <div className={`${modalClass} w-full max-w-md`}>
            <button type="button" onClick={cerrarModalSubaCategoria} className={closeButtonClass}>
              X
            </button>

            <h2 className="text-xl font-semibold text-white">Actualizar Margen de Ganancia por categoria</h2>
            <p className="mt-2 text-sm text-white/70">
              Aplica un mismo porcentaje de Ganancia a todos los productos de una categoria.
            </p>

            {errorSubaCategoria && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorSubaCategoria}
              </div>
            )}

            {exitoSubaCategoria && (
              <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {exitoSubaCategoria}
              </div>
            )}

            <form onSubmit={guardarSubaPorCategoria} className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Categoria</span>
                <select
                  value={categoriaSuba}
                  onChange={(event) => setCategoriaSuba(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:ring-2 focus:ring-sky-300/20"
                >
                  {categorias
                    .filter((categoria) => categoria !== "Todas")
                    .map((categoria) => (
                      <option key={categoria} value={categoria} className="bg-slate-900 text-white">
                        {categoria}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">SUBA (%)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subaCategoriaValor}
                  onChange={(event) => setSubaCategoriaValor(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/40 focus:bg-white/10 focus:ring-2 focus:ring-sky-300/20"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModalSubaCategoria}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSubaCategoria}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
                >
                  {guardandoSubaCategoria && <FaSpinner className="h-4 w-4 animate-spin" />}
                  Guardar Margen de Ganancia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPedidoAbierto && productoPedido && (
        <div className={`${overlayClass} items-center`}>
          <div className={`${modalClass} w-full max-w-md`}>
            <button type="button" onClick={cerrarModalPedido} className={closeButtonClass}>
              X
            </button>

            <h2 className="text-center text-xl font-semibold text-white">Solicitar pedido</h2>
            <p className="mt-2 text-sm text-white/70">
              Producto: <span className="font-semibold text-white">{productoPedido.nombre}</span>
            </p>
            <p className="text-sm text-white/70">
              Stock actual: <span className="font-semibold text-white">{productoPedido.stock}</span>
            </p>

            {errorPedido && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorPedido}
              </div>
            )}

            {exitoPedido && (
              <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {exitoPedido}
              </div>
            )}

            <form onSubmit={enviarPedido} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label htmlFor="cantidadPedido" className="text-sm font-medium text-white/80">
                  Cantidad a solicitar
                </label>
                <input
                  id="cantidadPedido"
                  name="cantidadPedido"
                  type="number"
                  min={1}
                  step={1}
                  value={cantidadPedido}
                  onChange={(event) => setCantidadPedido(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/40 focus:bg-white/10 focus:ring-2 focus:ring-sky-300/20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrarModalPedido}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPedido}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
                >
                  {guardandoPedido && <FaSpinner className="h-4 w-4 animate-spin" />}
                  Enviar solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalNoDisponiblesAbierto && (
        <div className={`${overlayClass} items-start py-10`}>
          <div className={`${modalClass} w-full max-w-3xl`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Añadir nuevo producto</h2>
                <p className="py-2 text-sm text-white/65">
                  Selecciona un nuevo producto para que este disponible en el catalogo
                </p>
              </div>
              <button type="button" onClick={cerrarModalNoDisponibles} className={closeButtonClass}>
                X
              </button>
            </div>

            {errorActivar && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorActivar}
              </div>
            )}

            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {noDisponibles.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-left text-white/65">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Producto</th>
                      <th className="px-4 py-2 font-semibold">Categoria</th>
                      <th className="px-4 py-2 font-semibold">Precio base</th>
                      <th className="px-4 py-2 font-semibold">IVA</th>
                      <th className="px-4 py-2 font-semibold">Margen de Ganancia</th>
                      <th className="px-4 py-2 font-semibold">Precio cliente</th>
                      <th className="px-4 py-2 font-semibold">Stock</th>
                      <th className="px-4 py-2 font-semibold">Descripcion</th>
                      <th className="px-4 py-2 font-semibold">Imagen</th>
                      <th className="px-4 py-2 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/85">
                    {noDisponibles.map((p) => (
                      <tr key={p.id} className="transition hover:bg-white/5">
                        <td className="px-4 py-2 text-center">{p.nombre}</td>
                        <td className="px-4 py-2">{p.categoria ?? "Sin categoria"}</td>
                        <td className="px-4 py-2">{MONEDA.format(p.precio_base)}</td>
                        <td className="px-4 py-2">{p.iva_porcentaje}%</td>
                        <td className="px-4 py-2">
                          <div className="flex min-w-[150px] items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftSubas[p.id] ?? String(p.subida_porcentaje ?? 0)}
                              onChange={(event) =>
                                setDraftSubas((prev) => ({ ...prev, [p.id]: event.target.value }))
                              }
                              className="w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-sky-300/40"
                            />
                            <span className="text-xs text-white/55">%</span>
                            <button
                              type="button"
                              onClick={() => guardarSubaProducto(p)}
                              disabled={guardandoSubaId === p.id}
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400 px-2 py-1 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                              title="Guardar Margen de Ganancia"
                            >
                              {guardandoSubaId === p.id ? (
                                <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FaSave className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">{MONEDA.format(p.precio_cliente)}</td>
                        <td className="px-4 py-2">{p.stock}</td>
                        <td className="max-w-[220px] px-4 py-2 text-xs text-white/60">
                          {p.descripcion ? (
                            <span title={p.descripcion}>
                              {p.descripcion.length > 90 ? `${p.descripcion.slice(0, 90)}...` : p.descripcion}
                            </span>
                          ) : (
                            <span className="italic text-white/35">Sin descripcion</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {p.imagen ? (
                            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                              <Image src={p.imagen} alt={p.nombre} fill className="object-cover" sizes="56px" />
                            </div>
                          ) : (
                            <span className="text-xs italic text-white/35">Sin imagen</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => activarProducto(p)}
                            disabled={activandoId === p.id}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            {activandoId === p.id ? (
                              <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MdEventAvailable className="h-4 w-4" />
                            )}
                            {activandoId === p.id ? "Activando..." : "Añadir"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/55">
                  No hay productos nuevos
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalInactivosAbierto && (
        <div className={`${overlayClass} items-start py-10`}>
          <div className={`${modalClass} w-full max-w-3xl`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Productos inactivos</h2>
              </div>
              <button type="button" onClick={cerrarModalInactivos} className={closeButtonClass}>
                X
              </button>
            </div>

            {errorActivar && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorActivar}
              </div>
            )}

            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {inactivos.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-left text-white/65">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Producto</th>
                      <th className="px-4 py-2 font-semibold">Categoria</th>
                      <th className="px-4 py-2 font-semibold">Precio base</th>
                      <th className="px-4 py-2 font-semibold">IVA</th>
                      <th className="px-4 py-2 font-semibold">Margen de Ganancia</th>
                      <th className="px-4 py-2 font-semibold">Precio cliente</th>
                      <th className="px-4 py-2 font-semibold">Stock</th>
                      <th className="px-4 py-2 font-semibold">Estado</th>
                      <th className="px-4 py-2 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/85">
                    {inactivos.map((p) => (
                      <tr key={p.id} className="transition hover:bg-white/5">
                        <td className="px-4 py-2">{p.nombre}</td>
                        <td className="px-4 py-2">{p.categoria ?? "Sin categoria"}</td>
                        <td className="px-4 py-2">{MONEDA.format(p.precio_base)}</td>
                        <td className="px-4 py-2">{p.iva_porcentaje}%</td>
                        <td className="px-4 py-2">
                          <div className="flex min-w-[150px] items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftSubas[p.id] ?? String(p.subida_porcentaje ?? 0)}
                              onChange={(event) =>
                                setDraftSubas((prev) => ({ ...prev, [p.id]: event.target.value }))
                              }
                              className="w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-sky-300/40"
                            />
                            <span className="text-xs text-white/55">%</span>
                            <button
                              type="button"
                              onClick={() => guardarSubaProducto(p)}
                              disabled={guardandoSubaId === p.id}
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400 px-2 py-1 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                              title="Guardar Margen de Ganancia"
                            >
                              {guardandoSubaId === p.id ? (
                                <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FaSave className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">{MONEDA.format(p.precio_cliente)}</td>
                        <td className="px-4 py-2">{p.stock}</td>
                        <td className="px-4 py-2 text-white/60">{p.estados ?? "Sin estado"}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => activarProducto(p)}
                            disabled={activandoId === p.id}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            {activandoId === p.id && <FaSpinner className="h-3.5 w-3.5 animate-spin" />}
                            {activandoId === p.id ? "Activando..." : "Activar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/55">
                  No hay ningun producto inactivo
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalVerAbierto && (
        <div className={`${overlayClass} items-center`}>
          <div className={`${modalClass} min-w-[320px] max-w-xs`}>
            <button onClick={cerrarModalVer} className="absolute right-4 top-4 text-white/45 transition hover:text-white">
              X
            </button>
            {productoVer ? (
              <>
                <h2 className="mb-4 text-lg font-bold text-white">Producto: {productoVer.nombre}</h2>
                <div className="space-y-2 text-sm text-white/75">
                  <div>
                    <span className="font-semibold text-white">Categoria:</span> {productoVer.categoria ?? "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Precio base:</span> {MONEDA.format(productoVer.precio_base)}
                  </div>
                  <div>
                    <span className="font-semibold text-white">IVA:</span> {productoVer.iva_porcentaje}%
                  </div>
                  <div>
                    <span className="font-semibold text-white">Margen de Ganancia:</span> {productoVer.subida_porcentaje}%
                  </div>
                  <div>
                    <span className="font-semibold text-white">Precio cliente:</span> {MONEDA.format(productoVer.precio_cliente)}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Stock:</span> {productoVer.stock}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Estado:</span>{" "}
                    {(productoVer.estados ?? "").toLowerCase() === "inactivo"
                      ? "Inactivo"
                      : productoVer.stock > 0
                        ? "Disponible"
                        : "Agotado"}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Descripcion:</span> {productoVer.descripcion ?? "-"}
                  </div>
                  {productoVer.id_proveedor != null && (
                    <div>
                      <span className="font-semibold text-white">Proveedor ID:</span> {productoVer.id_proveedor}
                    </div>
                  )}
                  {productoVer.imagen && (
                    <div className="relative mt-2 aspect-[4/3] w-full">
                      <Image
                        src={productoVer.imagen}
                        alt={productoVer.nombre}
                        fill
                        className="rounded-lg object-contain"
                        sizes="(max-width: 768px) 100vw, 600px"
                        priority
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin text-xl text-white/65" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modalInactivarAbierto && productoInactivar && (
        <div className={`${overlayClass} items-center`}>
          <div className={`${modalClass} min-w-[320px] max-w-sm`}>
            <button onClick={cerrarInactivar} className="absolute right-4 top-4 text-white/45 transition hover:text-white">
              X
            </button>
            <h2 className="mb-2 text-lg font-bold text-white">Descontinuar producto</h2>
            <p className="mb-4 text-sm text-white/70">
              Estas a punto de marcar como <span className="font-semibold">inactivo</span> el producto:
            </p>
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
              <div>
                <span className="font-semibold text-white">Nombre:</span> {productoInactivar.nombre}
              </div>
              <div>
                <span className="font-semibold text-white">Stock:</span> {productoInactivar.stock}
              </div>
              {(productoInactivar.estados ?? "").toLowerCase() === "inactivo" && (
                <div className="mt-1 text-xs text-amber-200">Este producto ya esta inactivo.</div>
              )}
            </div>

            {productoInactivar.stock > 0 && (
              <div className="mb-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                <span className="font-medium">Advertencia:</span> estas descontinuando un producto que aun tiene stock.
                No se eliminara, pero dejara de estar disponible para ventas.
              </div>
            )}

            {errorInactivar && <div className="mb-2 text-sm text-rose-200">{errorInactivar}</div>}

            <div className="flex gap-2">
              <button
                onClick={confirmarInactivar}
                disabled={guardandoInactivar || (productoInactivar.estados ?? "").toLowerCase() === "inactivo"}
                className="flex-1 rounded-2xl bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
              >
                {guardandoInactivar ? "Guardando..." : "Si, descontinuar"}
              </button>
              <button
                onClick={cerrarInactivar}
                className="flex-1 rounded-2xl border border-white/10 py-2 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">Inventario</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Gestion de productos</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
            Supervisa disponibilidad, revisa el catalogo y gestiona pedidos de reposicion sin alterar el flujo operativo.
          </p>
        </header>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={abrirModalSubaCategoria}
            className="inline-flex items-center justify-center rounded-full border border-amber-300/30 bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(245,158,11,0.22)] transition hover:bg-amber-200"
          >
            Ajustar Margen de Ganancia por categoria
          </button>
          <button
            type="button"
            onClick={abrirModalNoDisponibles}
            className="inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.25)] transition hover:bg-sky-300"
          >
            + Añadir nuevo producto{noDisponibles.length ? ` (${noDisponibles.length})` : ""}
          </button>
          <button
            type="button"
            onClick={abrirModalInactivos}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition hover:border-sky-300/40 hover:bg-white/15"
          >
            Ver productos inactivos
          </button>
        </div>

        <div className={`${panelClass} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/45">
              <Search />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, categoria, precio base, stock..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white shadow-sm outline-none ring-0 placeholder:text-white/35 focus:border-sky-300/40 focus:bg-white/10 focus:ring-2 focus:ring-sky-300/20"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-2.5 text-sm text-white shadow-sm outline-none [color-scheme:dark] focus:ring-2 focus:ring-sky-300/20"
          >
            {categorias.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        {(errorSuba || exitoSuba) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              errorSuba
                ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            {errorSuba ?? exitoSuba}
          </div>
        )}

        <div className={panelClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-white/65">
                <tr>
                  <th className="px-6 py-3 font-semibold">Producto</th>
                  <th className="px-6 py-3 font-semibold">Categoria</th>
                  <th className="px-6 py-3 font-semibold">Precio base</th>
                  <th className="px-6 py-3 font-semibold">IVA</th>
                  <th className="px-6 py-3 font-semibold">Margen de Ganancia</th>
                  <th className="px-6 py-3 font-semibold">Precio cliente</th>
                  <th className="px-6 py-3 font-semibold">Stock</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                  <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/85">
                {cargando && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-white/60">
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-xl text-white/60" />
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!cargando && error && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-rose-200">
                      {error}
                    </td>
                  </tr>
                )}

                {!cargando &&
                  !error &&
                  filtrados.map((p) => {
                    const estado = (p.estados ?? "").toLowerCase();
                    const esDisponible = estado === "disponible";
                    const esInactivo = estado === "inactivo";
                    const esNoDisponible = estado === "no disponible";
                    const esAgotado = (p.stock ?? 0) <= 0;
                    const estadoTexto = esAgotado ? "Agotado" : (p.estados ?? "Sin estado");
                    const estadoClass = esInactivo
                      ? "bg-white/10 text-white/55 ring-white/10"
                      : esNoDisponible
                        ? "bg-amber-500/10 text-amber-100 ring-amber-400/20"
                        : esAgotado
                          ? "bg-orange-500/10 text-orange-100 ring-orange-400/20"
                          : "bg-emerald-500/10 text-emerald-100 ring-emerald-400/20";

                    return (
                      <tr key={p.id} className="transition hover:bg-white/5">
                        <td className="px-6 py-3">{p.nombre}</td>
                        <td className="px-6 py-3">{p.categoria ?? "Sin categoria"}</td>
                        <td className="px-6 py-3">{MONEDA.format(p.precio_base)}</td>
                        <td className="px-6 py-3">{p.iva_porcentaje}%</td>
                        <td className="px-6 py-3">
                          <div className="flex min-w-[150px] items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftSubas[p.id] ?? String(p.subida_porcentaje ?? 0)}
                              onChange={(event) =>
                                setDraftSubas((prev) => ({ ...prev, [p.id]: event.target.value }))
                              }
                              className="w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-sky-300/40"
                            />
                            <span className="text-xs text-white/55">%</span>
                            <button
                              type="button"
                              onClick={() => guardarSubaProducto(p)}
                              disabled={guardandoSubaId === p.id}
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400 px-2 py-1 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                              title="Guardar Margen de Ganancia"
                            >
                              {guardandoSubaId === p.id ? (
                                <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FaSave className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3">{MONEDA.format(p.precio_cliente)}</td>
                        <td className="px-6 py-3">{p.stock}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${estadoClass}`}
                          >
                            {estadoTexto}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button title="Ver mas informacion" onClick={() => verProducto(p)} className={actionButtonClass}>
                              <Eye />
                            </button>

                            <button
                              title={
                                !esDisponible
                                  ? "Producto no disponible"
                                  : esAgotado
                                    ? "Producto agotado. Solicitar pedido"
                                    : p.pedidos
                                      ? "Pedido ya solicitado"
                                      : "Solicitar pedido"
                              }
                              type="button"
                              onClick={() => abrirModalPedido(p)}
                              disabled={!esDisponible || p.pedidos}
                              className={actionButtonClass}
                            >
                              <FaClipboardCheck className="h-4 w-4" />
                            </button>

                            <button
                              title={
                                !esDisponible
                                  ? "No disponible para descontinuar"
                                  : esAgotado
                                    ? "Producto agotado. Descontinuar"
                                    : "Descontinuar (inactivar)"
                              }
                              onClick={() => abrirInactivar(p)}
                              disabled={!esDisponible}
                              className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-2 text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-50"
                            >
                              <FaBan className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!cargando && !error && filtrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-white/55">
                      No hay productos para &quot;{query}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!cargando && !error && (
          <p className="text-sm text-white/60">
            Mostrando <span className="font-medium">{filtrados.length}</span> de{" "}
            <span className="font-medium">{totalDisponibles}</span> productos disponibles
          </p>
        )}
      </div>
    </main>
  );
}
