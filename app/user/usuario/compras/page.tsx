"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaPen, FaTrash } from "react-icons/fa";
import MercadoPagoWalletButtonEnv from "@/app/ui/mercadopago-wallet-button-env";

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

type PreferenceResponseData = {
  id: string | null;
  preference_id: string | null;
  init_point: string | null;
  sandbox_init_point: string | null;
  idPedidos: number[];
};

type PreferenceRequestItem = {
  id: string;
  title: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
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
    "Pago_Online" | "Contraentrega" | "Efectivo"
  >("Contraentrega");
  const [fechaHoraRetiro, setFechaHoraRetiro] = useState("");
  const [entregarOtraDireccion, setEntregarOtraDireccion] = useState(false);
  const [nombreRecibe, setNombreRecibe] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [ciudadEntrega, setCiudadEntrega] = useState("");
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [preferencePedidosKey, setPreferencePedidosKey] = useState<string | null>(null);
  const [preferenceIntentadaKey, setPreferenceIntentadaKey] = useState<string | null>(null);
  const [generandoPreferencia, setGenerandoPreferencia] = useState(false);

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
              metodoPagoSeleccionado === "Pago_Online"
                ? "Pago online gestionado por Mercado Pago"
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
                    (tipoEntrega === "Domicilio" && metodoPagoSeleccionado === "Contraentrega")
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
    } catch (err) {
      setAccionError(
        err instanceof Error ? err.message : "No se pudo confirmar la informacion de pago."
      );
    } finally {
      setConfirmandoPago(false);
    }
  }, [actualizarPedido, carrito, confirmandoPago, fetchJson, metodoPagoSeleccionado, tipoEntrega]);

  const prepararPagoOnline = useCallback(async () => {
    if (
      carrito.length === 0 ||
      confirmandoPago ||
      generandoPreferencia ||
      idsPedidosCarrito.length === 0
    ) {
      return;
    }

    const currentKey = `${tipoEntrega}:${idsPedidosCarrito.join(",")}`;
    if (preferenceId && preferencePedidosKey === currentKey) {
      return;
    }
    if (preferenceIntentadaKey === currentKey) {
      return;
    }

    const itemsPreferencia: PreferenceRequestItem[] = carrito.map((item) => ({
      id: `${item.pedido.idPedido}-${item.detalle.idDetallePedido}`,
      title: item.producto?.nombre ?? `Producto ${item.detalle.idProducto}`,
      quantity: item.detalle.cantidad,
      currency_id: "COP",
      unit_price: item.detalle.precioUnitario,
    }));

    setAccionError(null);
    setAccionExito(null);
    setGenerandoPreferencia(true);
    setPreferenceIntentadaKey(currentKey);

    try {
      const pagos = await fetchJson<Pago[]>("/api/pago");

      await Promise.all(
        idsPedidosCarrito.map(async (pedidoId) => {
          const monto = carrito
            .filter((item) => item.pedido.idPedido === pedidoId)
            .reduce((acc, item) => acc + item.detalle.precioUnitario * item.detalle.cantidad, 0);

          const payloadPago: Record<string, unknown> = {
            idPedido: pedidoId,
            metodoPago: "Pago_Online",
            estadoPago: "Pendiente",
            monto,
            fechaPago: null,
            observacion: "Pago online gestionado por Mercado Pago",
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

      const preference = await fetchJson<PreferenceResponseData>("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idPedidos: idsPedidosCarrito,
          items: itemsPreferencia,
          external_reference: `pedido-${idsPedidosCarrito.join("-")}`,
        }),
      });

      if (!preference.preference_id) {
        throw new Error("Mercado Pago no devolvio un preference_id valido.");
      }

      setPreferenceId(preference.preference_id);
      setPreferencePedidosKey(currentKey);
    } catch (err) {
      setPreferenceId(null);
      setPreferencePedidosKey(null);
      setAccionError(
        err instanceof Error ? err.message : "No se pudo preparar el pago online."
      );
    } finally {
      setGenerandoPreferencia(false);
    }
  }, [
    carrito,
    confirmandoPago,
    fetchJson,
    generandoPreferencia,
    idsPedidosCarrito,
    preferenceIntentadaKey,
    preferenceId,
    preferencePedidosKey,
    tipoEntrega,
  ]);

  useEffect(() => {
    if (!modalPagoAbierto) {
      setPreferenceId(null);
      setPreferencePedidosKey(null);
      setPreferenceIntentadaKey(null);
      setGenerandoPreferencia(false);
      return;
    }

    if (metodoPagoSeleccionado !== "Pago_Online") {
      setPreferenceId(null);
      setPreferencePedidosKey(null);
      setPreferenceIntentadaKey(null);
      return;
    }

    void prepararPagoOnline();
  }, [metodoPagoSeleccionado, modalPagoAbierto, prepararPagoOnline]);

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

          {accionError && !modalPedidoAbierto && !modalPagoAbierto && (
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
                const precioUnitario = formatoCOP.format(item.detalle.precioUnitario);
                const subtotal = formatoCOP.format(
                  item.detalle.precioUnitario * item.detalle.cantidad
                );
                return (
                  <article
                    key={item.detalle.idDetallePedido}
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
                        Pedido #{item.pedido.idPedido} | Creado el{" "}
                        {new Date(item.pedido.fechaCreacion).toLocaleDateString()}
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
                        disabled={eliminandoId === item.detalle.idDetallePedido || vaciando}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={() => {
                setAccionError(null);
                setModalPedidoAbierto(true);
              }}
              disabled={carrito.length === 0 || confirmandoPedido}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmandoPedido ? "Guardando..." : "Seguir comprando"}
            </button>
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

            {accionError && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {accionError}
              </div>
            )}

            <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Tipo de entrega</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {([
                  { value: "Domicilio", label: "Domicilio" },
                  { value: "Retiro_tienda", label: "Retiro en tienda" },
                ] as const).map((opcion) => (
                  <label
                    key={opcion.value}
                    className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      tipoEntrega === opcion.value ? "border-sky-400 text-black" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoEntrega"
                      value={opcion.value}
                      checked={tipoEntrega === opcion.value}
                      onChange={() => setTipoEntrega(opcion.value)}
                      className="h-4 w-4"
                    />
                    {opcion.label}
                  </label>
                ))}
              </div>
            </div>

            {tipoEntrega === "Retiro_tienda" ? (
              <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Retiro en tienda</p>
                <label className="block text-sm text-gray-600">
                  Hora al recoger
                  <input
                    type="datetime-local"
                    value={fechaHoraRetiro}
                    onChange={(e) => setFechaHoraRetiro(e.target.value)}
                    min={ahoraMinimaRetiro}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-sky-400"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Datos de entrega</p>
                {!entregarOtraDireccion ? (
                  <>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Nombre de quien recibe: {`${detalleUsuario?.nombre ?? ""} ${detalleUsuario?.apellido ?? ""}`.trim() || "Sin nombre registrado"}</p>
                      <p>Telefono: {detalleUsuario?.telefono ?? "Sin telefono registrado"}</p>
                      <p>Direccion: {detalleUsuario?.direccion ?? "Sin direccion registrada"}</p>
                      <p>Ciudad: {detalleUsuario?.ciudad ?? "Sin ciudad registrada"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntregarOtraDireccion(true)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                    >
                      <FaPen />
                      Entregar a otra direccion
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block text-sm text-gray-600">
                      Nombre de quien recibe
                      <input
                        type="text"
                        value={nombreRecibe}
                        onChange={(e) => setNombreRecibe(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-sky-400"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      Telefono
                      <input
                        type="text"
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-sky-400"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      Direccion
                      <input
                        type="text"
                        value={direccionEntrega}
                        onChange={(e) => setDireccionEntrega(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-sky-400"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      Ciudad
                      <input
                        type="text"
                        value={ciudadEntrega}
                        onChange={(e) => setCiudadEntrega(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-sky-400"
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
                      className="text-sm font-semibold text-gray-500 hover:text-gray-700"
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
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardarEntregaYContinuar()}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
              >
                {confirmandoPedido ? "Guardando..." : "Proceder al pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPagoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-gray-800 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Pago del pedido</h2>
            <p className="mt-1 text-sm text-gray-500">
              La entrega ya fue registrada. Ahora define como deseas pagar.
            </p>

            {accionError && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {accionError}
              </div>
            )}

            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>Tipo de entrega: {tipoEntrega === "Domicilio" ? "Domicilio" : "Retiro en tienda"}</p>
              {tipoEntrega === "Retiro_tienda" && fechaHoraRetiro && (
                <p>Retiro programado: {new Date(fechaHoraRetiro).toLocaleString()}</p>
              )}
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Metodo de pago</p>
              <div className="flex flex-col gap-2">
                {tipoEntrega === "Domicilio" ? (
                  <>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                        metodoPagoSeleccionado === "Pago_Online"
                          ? "border-sky-400 bg-white"
                          : "border-gray-200 bg-white/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={metodoPagoSeleccionado === "Pago_Online"}
                        onChange={() => setMetodoPagoSeleccionado("Pago_Online")}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block font-semibold text-gray-900">Pago Online</span>
                        <span className="block text-gray-500">
                          El pago online sera manejado por Mercado Pago con un flujo seguro.
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                        metodoPagoSeleccionado === "Contraentrega"
                          ? "border-sky-400 bg-white"
                          : "border-gray-200 bg-white/70"
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
                        <span className="block font-semibold text-gray-900">Contraentrega</span>
                        <span className="block text-gray-500">
                          Pagas al recibir el pedido en tu domicilio.
                        </span>
                      </span>
                    </label>
                  </>
                ) : (
                  <>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                        metodoPagoSeleccionado === "Efectivo"
                          ? "border-sky-400 bg-white"
                          : "border-gray-200 bg-white/70"
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
                        <span className="block font-semibold text-gray-900">Efectivo en tienda</span>
                        <span className="block text-gray-500">
                          Pagas directamente en la tienda al momento de recoger.
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                        metodoPagoSeleccionado === "Pago_Online"
                          ? "border-sky-400 bg-white"
                          : "border-gray-200 bg-white/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={metodoPagoSeleccionado === "Pago_Online"}
                        onChange={() => setMetodoPagoSeleccionado("Pago_Online")}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block font-semibold text-gray-900">Pago Online</span>
                        <span className="block text-gray-500">
                          El pago online sera manejado por Mercado Pago con proteccion y seguridad.
                        </span>
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {metodoPagoSeleccionado === "Pago_Online" && (
              <div className="mt-5 rounded-xl bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-900">
                  Pago online con Mercado Pago
                </p>
                <p className="mt-1 text-sm text-sky-700">
                  Se generara una preferencia con los pedidos actuales y su valor total. Al
                  completar el pago, Mercado Pago te redirigira segun el estado de la transaccion.
                </p>

                {generandoPreferencia ? (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-white p-4 text-sm text-sky-700">
                    Generando boton de pago...
                  </div>
                ) : preferenceId ? (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-white p-4">
                    <MercadoPagoWalletButtonEnv
                      preferenceId={preferenceId ?? ""}
                      title="Boton de pago"
                      description="Haz clic en el boton para continuar con Mercado Pago."
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    <p>Aun no se pudo generar la preferencia de pago.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPreferenceIntentadaKey(null);
                        void prepararPagoOnline();
                      }}
                      className="mt-3 rounded-lg border border-amber-300 px-3 py-2 font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalPagoAbierto(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
              {metodoPagoSeleccionado !== "Pago_Online" && (
                <button
                  type="button"
                  onClick={() => void confirmarPago()}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
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
