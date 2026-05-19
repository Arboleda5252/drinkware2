"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaPen, FaTrash } from "react-icons/fa";
import StripeCheckoutContainer from "@/app/ui/stripe-checkout-container";

type Usuario = {
  id: number;
  nombre: string;
  apellido?: string;
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
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number | null;
};

type Pedido = {
  idPedido: number;
  idCliente: number | null;
  idVendedor: number | null;
  fechaCreacion: string;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  observacion: string | null;
  subtotal: number;
  costoEnvio: number;
  total: number;
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
  pedido: Pedido;
  detalle: DetallePedido;
  producto: Producto | null;
};

type Entrega = {
  idEntrega: number;
  idPedido: number;
  idDomiciliario: number | null;
  direccionEntrega: string | null;
  ciudad: string | null;
  telefonoContacto: string | null;
  nombreRecibe: string | null;
  costoEnvio: number;
  estadoEntrega: string | null;
  fechaProgramada: string | null;
  fechaAsignacion: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;
  fechaHoraRetiro: string | null;
  observacion: string | null;
};

type Pago = {
  idPago: number;
  idPedido: number;
  metodoPago: string;
  estadoPago: string;
  monto: number;
  fechaPago: string | null;
  referenciaPago: string | null;
  observacion: string | null;
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatoRetiroResumen = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

const placeholderImagen = "/no-image.png";

export default function Page() {
  const router = useRouter();
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null);
  const [detalleUsuario, setDetalleUsuario] = useState<UsuarioDetalle | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [, setPedidosUsuario] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [accionExito, setAccionExito] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [vaciando, setVaciando] = useState(false);
  const [confirmandoPedido, setConfirmandoPedido] = useState(false);
  const [confirmandoPago, setConfirmandoPago] = useState(false);
  const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState<"Domicilio" | "Retiro_tienda">("Domicilio");
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<
    "Contraentrega" | "Efectivo" | "Stripe"
  >("Contraentrega");
  const [fechaHoraRetiro, setFechaHoraRetiro] = useState("");
  const [fechaRetiroInput, setFechaRetiroInput] = useState("");
  const [horaRetiroInput, setHoraRetiroInput] = useState("");
  const [entregarOtraDireccion, setEntregarOtraDireccion] = useState(false);
  const [nombreRecibe, setNombreRecibe] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [ciudadEntrega, setCiudadEntrega] = useState("");

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

  const ahoraMinimaRetiro = useMemo(() => {
    const ahora = new Date();
    ahora.setSeconds(0, 0);
    const offset = ahora.getTimezoneOffset();
    const local = new Date(ahora.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }, []);

  const fechaMinimaRetiro = useMemo(() => ahoraMinimaRetiro.slice(0, 10), [ahoraMinimaRetiro]);
  const horaMinimaRetiro = useMemo(() => ahoraMinimaRetiro.slice(11, 16), [ahoraMinimaRetiro]);
  const resumenRetiroSeleccionado = useMemo(() => {
    if (!fechaHoraRetiro) return null;
    const parsed = new Date(fechaHoraRetiro);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatoRetiroResumen.format(parsed);
  }, [fechaHoraRetiro]);

  const actualizarFechaHoraRetiro = useCallback((fecha: string, hora: string) => {
    setFechaHoraRetiro(fecha && hora ? `${fecha}T${hora}` : "");
  }, []);

  const loadData = useCallback(async () => {
    setCargando(true);
    setError(null);
    setAccionError(null);
     setAccionExito(null);
     setModalPedidoAbierto(false);
    try {
      const sesion = await fetch("/api/usuarioEstado", { cache: "no-store" });
      const sesionJson: { ok?: boolean; user?: { idusuario?: number; nombre?: string; nombreusuario?: string } } | null =
        await sesion.json().catch(() => null);
      const activoId = Number(sesionJson?.user?.idusuario);

      if (!sesion.ok || !sesionJson?.ok || !Number.isInteger(activoId) || activoId <= 0) {
        setUsuarioActivo(null);
        setDetalleUsuario(null);
        setPedidosUsuario([]);
        setCarrito([]);
        setError("No existe un usuario activo en este momento.");
        return;
      }

      const activo: Usuario = {
        id: activoId,
        nombre: String(sesionJson.user?.nombre ?? sesionJson.user?.nombreusuario ?? ""),
      };

      setUsuarioActivo(activo);
      try {
        const informacion = await fetchJson<UsuarioDetalle>(`/api/usuarios/${activo.id}`);
        setDetalleUsuario(informacion);
        setUsuarioActivo({
          id: informacion.id,
          nombre: informacion.nombre,
          apellido: informacion.apellido,
        });
      } catch (infoError) {
        console.warn("[Carrito] no se obtuvo informacion detallada del usuario", infoError);
        setDetalleUsuario(null);
      }

      const [pedidos, detalles] = await Promise.all([
        fetchJson<Pedido[]>("/api/pedidos"),
        fetchJson<DetallePedido[]>("/api/detalle_pedido"),
      ]);

      const pedidosPropios = pedidos.filter(
        (pedido) =>
          Number(pedido.idCliente) === activo.id &&
          (pedido.tipoEntrega ?? "").toLowerCase() === "pendiente" &&
          (pedido.estadoPedido ?? "Pendiente").toLowerCase() === "pendiente"
      );

      if (pedidosPropios.length === 0) {
        setPedidosUsuario([]);
        setCarrito([]);
        return;
      }

      const pedidosMap = new Map<number, Pedido>(
        pedidosPropios.map((pedido) => [Number(pedido.idPedido), pedido])
      );
      const pedidoIds = new Set(pedidosMap.keys());
      const detallesPropios = detalles.filter((detalle) => pedidoIds.has(Number(detalle.idPedido)));

      if (detallesPropios.length === 0) {
        setPedidosUsuario([]);
        setCarrito([]);
        return;
      }

      const uniqueIds = Array.from(new Set(detallesPropios.map((detalle) => detalle.idProducto)));
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

      const items = detallesPropios
        .map((detalle) => ({
          pedido: pedidosMap.get(Number(detalle.idPedido)) ?? null,
          detalle,
          producto: productosMap.get(detalle.idProducto) ?? null,
        }))
        .filter((item): item is ItemCarrito => item.pedido !== null);

      setPedidosUsuario(items);
      setCarrito(items);
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

  useEffect(() => {
    setNombreRecibe(
      detalleUsuario ? `${detalleUsuario.nombre} ${detalleUsuario.apellido}`.trim() : ""
    );
    setTelefonoContacto(detalleUsuario?.telefono ?? "");
    setDireccionEntrega(detalleUsuario?.direccion ?? "");
    setCiudadEntrega(detalleUsuario?.ciudad ?? "");
  }, [detalleUsuario]);

  useEffect(() => {
    if (!fechaHoraRetiro) {
      setFechaRetiroInput("");
      setHoraRetiroInput("");
      return;
    }

    setFechaRetiroInput(fechaHoraRetiro.slice(0, 10));
    setHoraRetiroInput(fechaHoraRetiro.slice(11, 16));
  }, [fechaHoraRetiro]);

  const actualizarPedido = useCallback(
    async (pedidoId: number, payload: Record<string, unknown>) => {
      await fetchJson<Pedido>(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    [fetchJson]
  );

  const eliminarPedido = useCallback(
    async (pedidoId: number) => {
      await fetchJson<{ idPedido: number }>(`/api/pedidos/${pedidoId}`, {
        method: "DELETE",
      });
    },
    [fetchJson]
  );

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

  const sincronizarPedido = useCallback(
    async (pedidoId: number, items: ItemCarrito[]) => {
      const itemsDelPedido = items.filter((item) => item.pedido.idPedido === pedidoId);
      if (itemsDelPedido.length === 0) {
        await eliminarPedido(pedidoId);
        return;
      }

      const subtotal = itemsDelPedido.reduce(
        (acc, item) => acc + item.detalle.precioUnitario * item.detalle.cantidad,
        0
      );

      await actualizarPedido(pedidoId, { subtotal });
    },
    [actualizarPedido, eliminarPedido]
  );

  const ejecutarBorrado = useCallback(
    async (item: ItemCarrito) => {
      await ajustarStock(item.detalle.idProducto, item.detalle.cantidad, "incrementar");
      try {
        await fetchJson<{ idDetallePedido: number }>(`/api/detalle_pedido/${item.detalle.idDetallePedido}`, {
          method: "DELETE",
        });
      } catch (err) {
        await ajustarStock(item.detalle.idProducto, item.detalle.cantidad, "disminuir").catch(
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
      setEliminandoId(item.detalle.idDetallePedido);
      try {
        await ejecutarBorrado(item);
        const carritoActualizado = carrito.filter(
          (fila) => fila.detalle.idDetallePedido !== item.detalle.idDetallePedido
        );
        await sincronizarPedido(item.pedido.idPedido, carritoActualizado);
        setCarrito(carritoActualizado);
        setPedidosUsuario((prev) =>
          prev.filter((fila) => fila.detalle.idDetallePedido !== item.detalle.idDetallePedido)
        );
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
    [carrito, ejecutarBorrado, sincronizarPedido]
  );

  const vaciarCarrito = useCallback(async () => {
    if (carrito.length === 0) {
      return;
    }
    setVaciando(true);
    setAccionError(null);
    const procesados = new Set(carrito.map((item) => item.detalle.idDetallePedido));
    const pendientes: ItemCarrito[] = [];
    for (const item of carrito) {
      try {
        await ejecutarBorrado(item);
      } catch {
        pendientes.push(item);
        setAccionError("No se pudieron eliminar todos los productos. Revisa tu conexion e intenta nuevamente.");
      }
    }

    const pedidosPendientes = new Set(pendientes.map((item) => item.pedido.idPedido));
    const pedidosProcesados = new Set(carrito.map((item) => item.pedido.idPedido));
    for (const pedidoId of pedidosProcesados) {
      const itemsRestantes = pendientes.filter((item) => item.pedido.idPedido === pedidoId);
      if (itemsRestantes.length === 0 || pedidosPendientes.has(pedidoId)) {
        await sincronizarPedido(pedidoId, pendientes).catch(() => undefined);
      }
    }

    setCarrito(pendientes);
    const pendientesIds = new Set(pendientes.map((item) => item.detalle.idDetallePedido));
    setPedidosUsuario((prev) =>
      prev.filter(
        (item) => !procesados.has(item.detalle.idDetallePedido) || pendientesIds.has(item.detalle.idDetallePedido)
      )
    );
    setVaciando(false);
  }, [carrito, ejecutarBorrado, sincronizarPedido]);

  const resumen = useMemo(() => {
    const totalProductos = carrito.reduce((acc, item) => acc + item.detalle.cantidad, 0);
    const subtotal = carrito.reduce(
      (acc, item) => acc + item.detalle.precioUnitario * item.detalle.cantidad,
      0
    );
    return { totalProductos, subtotal };
  }, [carrito]);

  const idsPedidosCarrito = useMemo(
    () => Array.from(new Set(carrito.map((item) => item.pedido.idPedido))).sort((a, b) => a - b),
    [carrito]
  );

  const estadoResumen = carrito.length === 0 && !cargando ? "Tu carrito esta vacio." : null;

  const construirUrlExito = useCallback(
    (metodoPago: "Contraentrega" | "Efectivo" | "Tarjeta") => {
      const params = new URLSearchParams({
        entrega: tipoEntrega,
        metodo: metodoPago,
        total: String(resumen.subtotal),
      });

      if (tipoEntrega === "Retiro_tienda" && fechaHoraRetiro) {
        params.set("retiro", fechaHoraRetiro);
      }

      return `/user/usuario/compras/exito?${params.toString()}`;
    },
    [fechaHoraRetiro, resumen.subtotal, tipoEntrega]
  );

  const guardarEntregaYContinuar = useCallback(async () => {
    if (carrito.length === 0 || confirmandoPedido) {
      return;
    }

    if (tipoEntrega === "Retiro_tienda" && !fechaHoraRetiro) {
      setAccionError("Debes seleccionar la fecha y hora de retiro en tienda.");
      return;
    }

    if (tipoEntrega === "Retiro_tienda") {
      const retiroSeleccionado = new Date(fechaHoraRetiro);
      if (Number.isNaN(retiroSeleccionado.getTime()) || retiroSeleccionado < new Date()) {
        setAccionError("La fecha y hora de retiro no puede ser anterior a la actual.");
        return;
      }
    }

    if (tipoEntrega === "Domicilio") {
      const nombreEntregaFinal = entregarOtraDireccion
        ? nombreRecibe.trim()
        : `${detalleUsuario?.nombre ?? ""} ${detalleUsuario?.apellido ?? ""}`.trim();
      const telefonoEntregaFinal = entregarOtraDireccion
        ? telefonoContacto.trim()
        : detalleUsuario?.telefono?.trim() ?? "";
      const direccionEntregaFinal = entregarOtraDireccion
        ? direccionEntrega.trim()
        : detalleUsuario?.direccion?.trim() ?? "";
      const ciudadEntregaFinal = entregarOtraDireccion
        ? ciudadEntrega.trim()
        : detalleUsuario?.ciudad?.trim() ?? "";

      if (!nombreEntregaFinal || !telefonoEntregaFinal || !direccionEntregaFinal || !ciudadEntregaFinal) {
        setAccionError("Completa los datos de entrega para domicilio.");
        return;
      }
    }

    setAccionError(null);
    setAccionExito(null);
    setConfirmandoPedido(true);
    try {
      const idsPedidos = Array.from(new Set(carrito.map((item) => item.pedido.idPedido)));
      const entregas = await fetchJson<Entrega[]>("/api/entrega");

      await Promise.all(
        idsPedidos.map(async (pedidoId) => {
          const payload: Record<string, unknown> = {
            idPedido: pedidoId,
            estadoEntrega: "Pendiente",
            costoEnvio: 0,
            observacion: null,
          };

          if (tipoEntrega === "Retiro_tienda") {
            payload.fechaHoraRetiro = new Date(fechaHoraRetiro).toISOString();
            payload.nombreRecibe = null;
            payload.telefonoContacto = null;
            payload.direccionEntrega = null;
            payload.ciudad = null;
          } else {
            payload.nombreRecibe = entregarOtraDireccion
              ? nombreRecibe.trim()
              : `${detalleUsuario?.nombre ?? ""} ${detalleUsuario?.apellido ?? ""}`.trim();
            payload.telefonoContacto = entregarOtraDireccion
              ? telefonoContacto.trim()
              : detalleUsuario?.telefono?.trim() ?? null;
            payload.direccionEntrega = entregarOtraDireccion
              ? direccionEntrega.trim()
              : detalleUsuario?.direccion?.trim() ?? null;
            payload.ciudad = entregarOtraDireccion
              ? ciudadEntrega.trim()
              : detalleUsuario?.ciudad?.trim() ?? null;
            payload.fechaHoraRetiro = null;
          }

          const entregaExistente = entregas.find((entrega) => Number(entrega.idPedido) === pedidoId);
          if (entregaExistente) {
            await fetchJson<Entrega>(`/api/entrega/${entregaExistente.idEntrega}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            return;
          }

          await fetchJson<Entrega>("/api/entrega", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setModalPedidoAbierto(false);
      setMetodoPagoSeleccionado(tipoEntrega === "Retiro_tienda" ? "Efectivo" : "Contraentrega");
      setModalPagoAbierto(true);
    } catch (err) {
      setAccionError(
        err instanceof Error ? err.message : "No se pudo guardar la entrega. Intenta nuevamente."
      );
    } finally {
      setConfirmandoPedido(false);
    }
  }, [
    carrito,
    ciudadEntrega,
    confirmandoPedido,
    detalleUsuario,
    direccionEntrega,
    entregarOtraDireccion,
    fechaHoraRetiro,
    fetchJson,
    nombreRecibe,
    telefonoContacto,
    tipoEntrega,
  ]);

  const confirmarPago = useCallback(async () => {
    if (carrito.length === 0 || confirmandoPago) {
      return;
    }

    setAccionError(null);
    setAccionExito(null);
    setConfirmandoPago(true);

    try {
      const idsPedidos = Array.from(new Set(carrito.map((item) => item.pedido.idPedido)));
      const pagos = await fetchJson<Pago[]>("/api/pago");

      await Promise.all(
        idsPedidos.map(async (pedidoId) => {
          const monto = carrito
            .filter((item) => item.pedido.idPedido === pedidoId)
            .reduce((acc, item) => acc + item.detalle.precioUnitario * item.detalle.cantidad, 0);

          const esRetiroEfectivo = tipoEntrega === "Retiro_tienda" && metodoPagoSeleccionado === "Efectivo";
          const esDomicilioContraentrega =
            tipoEntrega === "Domicilio" && metodoPagoSeleccionado === "Contraentrega";

          await actualizarPedido(pedidoId, {
            tipoEntrega,
            estadoPedido: esRetiroEfectivo || esDomicilioContraentrega ? "Confirmado" : "Pendiente",
          });

          const payloadPago: Record<string, unknown> = {
            idPedido: pedidoId,
            metodoPago: metodoPagoSeleccionado,
            estadoPago: "Pendiente",
            monto,
            fechaPago: null,
            observacion:
              metodoPagoSeleccionado === "Stripe"
                ? "Pago online pendiente de integracion final con Stripe"
                : null,
          };

          const pagoExistente = pagos.find((pago) => Number(pago.idPedido) === pedidoId);
          if (pagoExistente) {
            await fetchJson<Pago>(`/api/pago/${pagoExistente.idPago}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadPago),
            });
            return;
          }

          await fetchJson<Pago>("/api/pago", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadPago),
          });
        })
      );

      setPedidosUsuario((prev) =>
        prev.map((item) =>
          idsPedidos.includes(item.pedido.idPedido)
            ? {
                ...item,
                pedido: {
                  ...item.pedido,
                  tipoEntrega,
                  estadoPedido:
                    (tipoEntrega === "Retiro_tienda" && metodoPagoSeleccionado === "Efectivo") ||
                    (tipoEntrega === "Domicilio" &&
                      metodoPagoSeleccionado === "Contraentrega")
                      ? "Confirmado"
                      : "Pendiente",
                },
              }
            : item
        )
      );

      setCarrito([]);
      setModalPagoAbierto(false);
      setAccionExito("Pago configurado correctamente.");
      router.push(
        construirUrlExito(metodoPagoSeleccionado === "Stripe" ? "Tarjeta" : metodoPagoSeleccionado)
      );
    } catch (err) {
      setAccionError(
        err instanceof Error ? err.message : "No se pudo confirmar la informacion de pago."
      );
    } finally {
      setConfirmandoPago(false);
    }
  }, [
    actualizarPedido,
    carrito,
    confirmandoPago,
    construirUrlExito,
    fetchJson,
    metodoPagoSeleccionado,
    router,
    tipoEntrega,
  ]);

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <section className="flex-1 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                Carrito de Compras
              </h1>
              {usuarioActivo && (
                <p className="text-sm text-slate-300">
                  Compras de{" "}
                  <span className="font-semibold text-white">
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
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaTrash />
                Vaciar carrito
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md">
              {error}
            </div>
          )}

          {accionError && !modalPedidoAbierto && !modalPagoAbierto && (
            <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md">
              {accionError}
            </div>
          )}
          {accionExito && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md">
              {accionExito}
            </div>
          )}

          {cargando ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-14">
              <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/10"
                >
                  <svg
                    className="mr-3 size-5 animate-spin text-white"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Cargando tu carrito
                </button>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                  Espera un momento
                </p>
                <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                  Estamos preparando tus compras.
                </h2>
              </div>
            </div>
          ) : estadoResumen ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-14">
              <div className="mx-auto flex max-w-xl flex-col items-center">
                <div className="rounded-full border-4 border-sky-300/30 bg-white/5 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <Image
                    src="/img/corona.jpg"
                    alt="Descubre productos destacados"
                    width={180}
                    height={180}
                    className="h-40 w-40 rounded-full object-cover sm:h-44 sm:w-44"
                  />
                </div>
                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                  Mi carrito esta vacio
                </p>
                <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                  Nada por aqui todavia.
                </h2>
                <p className="mt-3 max-w-lg text-lg text-slate-300">
                  Descubre descuentos y llena tu carrito.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/productos")}
                  className="mt-8 rounded-2xl bg-sky-500 px-8 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Ir a Productos
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {carrito.map((item) => {
                const imagen = item.producto?.imagen || placeholderImagen;
                const precioUnitario = formatoCOP.format(item.detalle.precioUnitario);
                const subtotal = formatoCOP.format(
                  item.detalle.precioUnitario * item.detalle.cantidad
                );
                return (
                  <article
                    key={item.detalle.idDetallePedido}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center justify-center rounded-2xl bg-black/20 p-2 ring-1 ring-white/10">
                      <Image
                        src={imagen}
                        alt={item.producto?.nombre ?? "Producto sin nombre"}
                        width={110}
                        height={140}
                        className="h-40 w-28 rounded-lg object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {item.producto?.nombre ?? "Producto sin nombre"}
                      </h2>

                      <p className="text-sm text-slate-300">
                        Categoria: {item.producto?.categoria ?? "Sin categoria"} | Estado del
                        producto: {item.producto?.estados ?? "Sin estado"}
                      </p>

                      <p className="text-sm text-slate-400">
                        Num. de Referencia {item.pedido.idPedido} 
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-base font-semibold text-white">{precioUnitario}</p>
                        <p className="text-sm text-slate-400">
                          x {item.detalle.cantidad} unidad
                          {item.detalle.cantidad > 1 ? "es" : ""}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-white">{subtotal}</p>
                      <button
                        type="button"
                        onClick={() => void eliminarProducto(item)}
                        disabled={eliminandoId === item.detalle.idDetallePedido || vaciando}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTrash />
                        {eliminandoId === item.detalle.idDetallePedido ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="w-full lg:w-80">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <h2 className="text-lg font-semibold text-white">Resumen del pedido</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Productos</span>
                <span>{resumen.totalProductos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatoCOP.format(resumen.subtotal)}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between text-xl font-bold text-white">
                <span>Total a pagar</span>
                <span>{formatoCOP.format(resumen.subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/productos")}
              className="mt-6 w-full rounded-2xl bg-sky-500 py-3 text-lg font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Agregar mas productos
            </button>

            <button
              type="button"
              onClick={() => {
                setAccionError(null);
                setModalPedidoAbierto(true);
              }}
              disabled={carrito.length === 0 || confirmandoPedido}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/15 py-3 text-lg font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmandoPedido ? "Guardando..." : "Continuar comprando"}
            </button>
          </div>
        </aside>
      </div>

      {modalPedidoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <h2 className="text-2xl font-bold text-white">Detalles del envio</h2>
            <p className="mt-1 text-sm text-slate-400">
              Revisa tu informacion antes de finalizar.
            </p>

            {accionError && (
              <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                {accionError}
              </div>
            )}

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-slate-200">Tipo de entrega</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {([
                  { value: "Domicilio", label: "Domicilio" },
                  { value: "Retiro_tienda", label: "Retiro en tienda" },
                ] as const).map((opcion) => (
                  <label
                    key={opcion.value}
                    className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      tipoEntrega === opcion.value
                        ? "border-sky-400 bg-sky-400/10 text-white"
                        : "border-white/10 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoEntrega"
                      value={opcion.value}
                      checked={tipoEntrega === opcion.value}
                      onChange={() => {
                        setTipoEntrega(opcion.value);
                        setMetodoPagoSeleccionado(
                          opcion.value === "Retiro_tienda" ? "Efectivo" : "Contraentrega"
                        );
                      }}
                      className="h-4 w-4"
                    />
                    {opcion.label}
                  </label>
                ))}
              </div>
            </div>

            {tipoEntrega === "Retiro_tienda" ? (
              <div className="mt-5 rounded-3xl border border-sky-300/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(15,23,42,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                      Retiro en tienda
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      Elige el dia y la hora para recoger tu pedido
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                      Selecciona un horario posterior al actual. Prepararemos tu compra para que
                      puedas retirarla sin contratiempos.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-100">
                        Dia de retiro
                      </span>
                      <span className="mt-1 block text-sm text-slate-400">
                        Elige el dia en el que pasaras por la tienda.
                      </span>
                      <input
                        type="date"
                        value={fechaRetiroInput}
                        min={fechaMinimaRetiro}
                        onChange={(e) => {
                          const nextFecha = e.target.value;
                          setFechaRetiroInput(nextFecha);
                          actualizarFechaHoraRetiro(nextFecha, horaRetiroInput);
                        }}
                        className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-100">
                        Hora de retiro
                      </span>
                      <span className="mt-1 block text-sm text-slate-400">
                        Selecciona la hora exacta para recoger el pedido.
                      </span>
                      <input
                        type="time"
                        value={horaRetiroInput}
                        min={fechaRetiroInput === fechaMinimaRetiro ? horaMinimaRetiro : undefined}
                        step={60}
                        onChange={(e) => {
                          const nextHora = e.target.value;
                          setHoraRetiroInput(nextHora);
                          actualizarFechaHoraRetiro(fechaRetiroInput, nextHora);
                        }}
                        className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </label>
                  </div>

                  {resumenRetiroSeleccionado ? (
                    <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                        Retiro programado
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {resumenRetiroSeleccionado}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      Primero elige el dia
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      No se permiten horarios pasados
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-slate-200">Datos de entrega</p>
                {!entregarOtraDireccion ? (
                  <>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>Nombre de quien recibe: {`${detalleUsuario?.nombre ?? ""} ${detalleUsuario?.apellido ?? ""}`.trim() || "Sin nombre registrado"}</p>
                      <p>Telefono: {detalleUsuario?.telefono ?? "Sin telefono registrado"}</p>
                      <p>Direccion: {detalleUsuario?.direccion ?? "Sin direccion registrada"}</p>
                      <p>Ciudad: {detalleUsuario?.ciudad ?? "Sin ciudad registrada"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntregarOtraDireccion(true)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
                    >
                      <FaPen />
                      Entregar a otra direccion
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block text-sm text-slate-300">
                      Nombre de quien recibe
                      <input
                        type="text"
                        value={nombreRecibe}
                        onChange={(e) => setNombreRecibe(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400"
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Telefono
                      <input
                        type="text"
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400"
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Direccion
                      <input
                        type="text"
                        value={direccionEntrega}
                        onChange={(e) => setDireccionEntrega(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400"
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      Ciudad
                      <input
                        type="text"
                        value={ciudadEntrega}
                        onChange={(e) => setCiudadEntrega(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEntregarOtraDireccion(false);
                        setNombreRecibe(
                          detalleUsuario ? `${detalleUsuario.nombre} ${detalleUsuario.apellido}`.trim() : ""
                        );
                        setTelefonoContacto(detalleUsuario?.telefono ?? "");
                        setDireccionEntrega(detalleUsuario?.direccion ?? "");
                        setCiudadEntrega(detalleUsuario?.ciudad ?? "");
                      }}
                      className="text-sm font-semibold text-slate-400 hover:text-white"
                    >
                      Usar direccion registrada
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalPedidoAbierto(false);
                  setAccionExito(null);
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardarEntregaYContinuar()}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
              >
                {confirmandoPedido ? "Guardando..." : "Proceder al pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPagoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
          <div
            className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.45)] ${
              metodoPagoSeleccionado === "Stripe" ? "max-w-5xl" : "max-w-lg"
            }`}
          >
            <h2 className="text-2xl font-bold text-white">Pago del pedido</h2>
            <p className="mt-1 text-sm text-slate-400">
              La entrega ya fue registrada. Ahora define como deseas pagar.
            </p>

            {accionError && (
              <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                {accionError}
              </div>
            )}

            <div
              className={`mt-5 min-h-0 flex-1 overflow-y-auto pr-1 grid gap-5 ${
                metodoPagoSeleccionado === "Stripe" ? "lg:grid-cols-[360px_minmax(0,1fr)]" : ""
              }`}
            >
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p>
                    Tipo de entrega: {tipoEntrega === "Domicilio" ? "Domicilio" : "Retiro en tienda"}
                  </p>
                  {tipoEntrega === "Retiro_tienda" && fechaHoraRetiro && (
                    <p>Retiro programado: {new Date(fechaHoraRetiro).toLocaleString()}</p>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-slate-200">Metodo de pago</p>
                  <div className="flex flex-col gap-2">
                    {tipoEntrega === "Domicilio" ? (
                      <>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                            metodoPagoSeleccionado === "Contraentrega"
                              ? "border-sky-400 bg-sky-400/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="metodoPago"
                            checked={metodoPagoSeleccionado === "Contraentrega"}
                            onChange={() => setMetodoPagoSeleccionado("Contraentrega")}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-semibold text-white">Contraentrega</span>
                            <span className="block text-slate-400">
                              Pagas al recibir el pedido en tu domicilio.
                            </span>
                          </span>
                        </label>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                            metodoPagoSeleccionado === "Stripe"
                              ? "border-sky-400 bg-sky-400/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="metodoPago"
                            checked={metodoPagoSeleccionado === "Stripe"}
                            onChange={() => setMetodoPagoSeleccionado("Stripe")}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-semibold text-white">Stripe</span>
                            <span className="block text-slate-400">
                              Pago online con tarjeta usando Stripe.
                            </span>
                          </span>
                        </label>
                      </>
                    ) : (
                      <>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                            metodoPagoSeleccionado === "Efectivo"
                              ? "border-sky-400 bg-sky-400/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="metodoPago"
                            checked={metodoPagoSeleccionado === "Efectivo"}
                            onChange={() => setMetodoPagoSeleccionado("Efectivo")}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-semibold text-white">Efectivo en tienda</span>
                            <span className="block text-slate-400">
                              Pagas directamente en la tienda al momento de recoger.
                            </span>
                          </span>
                        </label>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                            metodoPagoSeleccionado === "Stripe"
                              ? "border-sky-400 bg-sky-400/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="metodoPago"
                            checked={metodoPagoSeleccionado === "Stripe"}
                            onChange={() => setMetodoPagoSeleccionado("Stripe")}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-semibold text-white">Stripe</span>
                            <span className="block text-slate-400">
                              Pago online con tarjeta usando Stripe.
                            </span>
                          </span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {metodoPagoSeleccionado === "Stripe" && (
                <div className="min-h-0 rounded-3xl border border-sky-300/20 bg-sky-500/10 p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-sky-200">Pago online con Stripe</p>
                      <p className="mt-1 text-sm text-slate-300">
                        El monto del pedido se envia a Stripe desde este checkout en pesos
                        colombianos.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-black/20 px-4 py-3 text-right shadow-sm ring-1 ring-white/10">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                        Total
                      </p>
                      <p className="text-lg font-bold text-white">
                        {formatoCOP.format(resumen.subtotal)}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-[65vh] overflow-y-auto pr-1">
                    <StripeCheckoutContainer
                      amount={resumen.subtotal}
                      idCliente={usuarioActivo?.id ?? null}
                      idPedidos={idsPedidosCarrito}
                      tipoEntrega={tipoEntrega}
                      fechaHoraRetiro={tipoEntrega === "Retiro_tienda" ? fechaHoraRetiro : null}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex shrink-0 justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setModalPagoAbierto(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                Cerrar
              </button>
              {metodoPagoSeleccionado !== "Stripe" && (
                <button
                  type="button"
                  onClick={() => void confirmarPago()}
                  disabled={confirmandoPago}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                >
                  {confirmandoPago ? "Confirmando..." : "Confirmar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
