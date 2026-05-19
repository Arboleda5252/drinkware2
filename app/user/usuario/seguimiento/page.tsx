"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { FaChevronDown } from "react-icons/fa";
import { FaMotorcycle } from "react-icons/fa6";
import { GoClockFill } from "react-icons/go";

type Usuario = {
  id: number;
  nombre: string;
  apellido?: string;
};

type UsuarioDirectorio = {
  id: number;
  nombre: string | null;
  apellido: string | null;
};

type Domiciliario = {
  idDomiciliario: number;
  idUsuario: number;
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

type DetallePedido = {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number | null;
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

type HistorialEntrega = {
  idHistorial: number;
  idEntrega: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  comentario: string | null;
  fotoEvidencia: string | null;
};

type PedidoConDetalle = {
  pedido: Pedido;
  detalles: Array<{
    detalle: DetallePedido;
    producto: Producto | null;
  }>;
  pago: Pago | null;
  entrega: Entrega | null;
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const placeholderImagen = "/no-image.png";
const pasosDomicilio = [
  { label: "En preparación", span: "col-span-1" },
  { label: "Asignado", span: "col-span-1" },
  { label: "En camino", span: "col-span-2" },
  { label: "Entregado", span: "col-span-1" },
] as const;

const normalizarTexto = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const formatearFecha = (value: string | null | undefined): ReactNode =>
  value ? (
    new Date(value).toLocaleString()
  ) : (
    <span className="inline-flex items-center text-slate-400" aria-label="Pendiente">
      <GoClockFill className="h-4 w-4" />
    </span>
  );

const esContraentrega = (metodoPago: string | null | undefined) =>
  normalizarTexto(metodoPago).includes("contraentrega");

const esEstadoIncidenciaEntrega = (estado: string | null | undefined) => {
  const normalizado = normalizarTexto(estado);
  return normalizado.includes("no_entregado") || normalizado.includes("cancelado");
};

const obtenerEstadoIncidenciaEntrega = (entrega: Entrega | null) => {
  const estado = normalizarTexto(entrega?.estadoEntrega);

  if (estado.includes("no_entregado")) {
    return "No entregado";
  }

  if (estado.includes("cancelado")) {
    return "Cancelado";
  }

  return null;
};

const obtenerPasoDomicilio = (entrega: Entrega | null) => {
  const estado = normalizarTexto(entrega?.estadoEntrega);

  if (estado.includes("no_entregado") || estado.includes("cancelado")) {
    return 2;
  }

  if (estado.includes("entregado") || entrega?.fechaEntrega) {
    return 3;
  }

  if (estado.includes("camino") || entrega?.fechaSalida) {
    return 2;
  }

  if (estado.includes("asign") || entrega?.fechaAsignacion || entrega?.idDomiciliario) {
    return 1;
  }

  return 0;
};

export default function Page() {
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null);
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [domiciliariosNombres, setDomiciliariosNombres] = useState<Map<number, string>>(new Map());
  const [observacionesHistorial, setObservacionesHistorial] = useState<Map<number, string>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    pendientes: true,
    entregados: false,
    cancelados: false,
  });

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

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);

      try {
        const sesion = await fetch("/api/usuarioEstado", { cache: "no-store" });
        const sesionJson: { ok?: boolean; user?: { idusuario?: number; nombre?: string; nombreusuario?: string } } | null =
          await sesion.json().catch(() => null);
        const activoId = Number(sesionJson?.user?.idusuario);

        if (!sesion.ok || !sesionJson?.ok || !Number.isInteger(activoId) || activoId <= 0) {
          throw new Error("No existe un usuario activo en este momento.");
        }

        const usuario: Usuario = {
          id: activoId,
          nombre: String(sesionJson.user?.nombre ?? sesionJson.user?.nombreusuario ?? ""),
        };

        const [pedidosRaw, detallesRaw, pagosRaw, entregasRaw, domiciliariosRaw, usuariosRaw, historialRaw] = await Promise.all([
          fetchJson<Pedido[]>("/api/pedidos"),
          fetchJson<DetallePedido[]>("/api/detalle_pedido"),
          fetchJson<Pago[]>("/api/pago"),
          fetchJson<Entrega[]>("/api/entrega"),
          fetchJson<Domiciliario[]>("/api/domiciliario"),
          fetchJson<UsuarioDirectorio[]>("/api/usuarios"),
          fetchJson<HistorialEntrega[]>("/api/historial_entrega"),
        ]);

        const pedidosPropios = pedidosRaw.filter((pedido) => {
          const esMio = Number(pedido.idCliente) === usuario.id;
          const esBorradorCarrito =
            (pedido.tipoEntrega ?? "").toLowerCase() === "pendiente" &&
            (pedido.estadoPedido ?? "").toLowerCase() === "pendiente";
          return esMio && !esBorradorCarrito;
        });

        const productoIds = Array.from(
          new Set(
            detallesRaw
              .filter((detalle) => pedidosPropios.some((pedido) => pedido.idPedido === detalle.idPedido))
              .map((detalle) => detalle.idProducto)
          )
        );

        const productosPairs = await Promise.all(
          productoIds.map(async (productoId) => {
            try {
              const producto = await fetchJson<Producto>(`/api/productos/${productoId}`);
              return [productoId, producto] as const;
            } catch {
              return [productoId, null] as const;
            }
          })
        );

        const productosMap = new Map<number, Producto | null>(productosPairs);
        const usuariosMap = new Map<number, UsuarioDirectorio>(
          usuariosRaw.map((item) => [Number(item.id), item])
        );
        const domiciliariosMap = new Map<number, string>(
          domiciliariosRaw.map((domiciliario) => {
            const usuarioDomiciliario = usuariosMap.get(Number(domiciliario.idUsuario));
            const nombreCompleto =
              [usuarioDomiciliario?.nombre, usuarioDomiciliario?.apellido]
                .filter(Boolean)
                .join(" ")
                .trim() || `Domiciliario #${domiciliario.idDomiciliario}`;
            return [Number(domiciliario.idDomiciliario), nombreCompleto];
          })
        );
        const observacionesPorEntrega = new Map<number, string>();
        for (const item of historialRaw) {
          if (!esEstadoIncidenciaEntrega(item.estadoNuevo) || !item.comentario?.trim()) {
            continue;
          }
          if (!observacionesPorEntrega.has(Number(item.idEntrega))) {
            observacionesPorEntrega.set(Number(item.idEntrega), item.comentario.trim());
          }
        }

        const pedidosConDetalle: PedidoConDetalle[] = pedidosPropios.map((pedido) => {
          const detalles = detallesRaw
            .filter((detalle) => Number(detalle.idPedido) === Number(pedido.idPedido))
            .map((detalle) => ({
              detalle,
              producto: productosMap.get(detalle.idProducto) ?? null,
            }));

          const pago = pagosRaw.find((item) => Number(item.idPedido) === Number(pedido.idPedido)) ?? null;
          const entrega =
            entregasRaw.find((item) => Number(item.idPedido) === Number(pedido.idPedido)) ?? null;

          return { pedido, detalles, pago, entrega };
        });

        if (!cancelado) {
          setUsuarioActivo(usuario);
          setDomiciliariosNombres(domiciliariosMap);
          setObservacionesHistorial(observacionesPorEntrega);
          setPedidos(
            pedidosConDetalle.sort(
              (a, b) =>
                new Date(b.pedido.fechaCreacion).getTime() - new Date(a.pedido.fechaCreacion).getTime()
            )
          );
        }
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el seguimiento.");
          setPedidos([]);
          setDomiciliariosNombres(new Map());
          setObservacionesHistorial(new Map());
          setUsuarioActivo(null);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [fetchJson]);

  const totalPedidos = useMemo(() => pedidos.length, [pedidos]);
  const pedidosPendientes = useMemo(
    () =>
      pedidos.filter(
        ({ pedido }) => {
          const estado = (pedido.estadoPedido ?? "").toLowerCase();
          return estado === "confirmado" || estado === "pendiente";
        }
      ),
    [pedidos]
  );
  const pedidosEntregados = useMemo(
    () =>
      pedidos.filter(
        ({ pedido }) => (pedido.estadoPedido ?? "").toLowerCase() === "entregado"
      ),
    [pedidos]
  );
  const pedidosCancelados = useMemo(
    () =>
      pedidos.filter(
        ({ pedido }) => (pedido.estadoPedido ?? "").toLowerCase() === "cancelado"
      ),
    [pedidos]
  );

  const toggleSeccion = (key: "pendientes" | "entregados" | "cancelados") => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const obtenerNombreDomiciliario = (idDomiciliario: number | null) => {
    if (!idDomiciliario) {
      return "Pendiente por asignar";
    }

    return domiciliariosNombres.get(idDomiciliario) ?? `Asignado #${idDomiciliario}`;
  };

  const obtenerObservacionIncidencia = (entrega: Entrega | null) => {
    if (!entrega?.idEntrega) {
      return null;
    }

    return observacionesHistorial.get(Number(entrega.idEntrega)) ?? null;
  };

  const renderPedido = (
    { pedido, detalles, pago, entrega }: PedidoConDetalle,
    esSeccionPendientes: boolean
  ) => {
    const esRetiroTienda = pedido.tipoEntrega === "Retiro_tienda";
    const esDomicilio = !esRetiroTienda;
    const totalPedido = pedido.subtotal + pedido.costoEnvio;
    const pasoDomicilioActivo = obtenerPasoDomicilio(entrega);
    const mostrarAvisoContraentrega =
      esSeccionPendientes && esDomicilio && esContraentrega(pago?.metodoPago);
    const mensajePendiente = esRetiroTienda
      ? entrega?.fechaHoraRetiro
        ? `Tu pedido esta listo para recoger en tienda desde ${new Date(
          entrega.fechaHoraRetiro
        ).toLocaleString()}.`
        : "Tu pedido esta pendiente para recoger en tienda."
      : `Estado de entrega: ${entrega?.estadoEntrega ?? "Pendiente"}`;
    const observacionIncidencia = obtenerObservacionIncidencia(entrega);

    return (
      <article
        key={pedido.idPedido}
        className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-md"
      >
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Detalle de tu compra</h2>
              <p className="mt-1 text-base text-slate-400">
                Ref # {pedido.idPedido}. Creado el {new Date(pedido.fechaCreacion).toLocaleString()}
              </p>
              {(pedido.estadoPedido ?? "").toLowerCase() === "pendiente" && (
                <p className="mt-1 text-base text-slate-300">{mensajePendiente}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {detalles.map(({ detalle, producto }) => {
            const imagen = producto?.imagen || placeholderImagen;
            const subtotal = detalle.subtotal ?? detalle.precioUnitario * detalle.cantidad;

            return (
              <div
                key={detalle.idDetallePedido}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center justify-center rounded-xl bg-white/5 p-1.5 ring-1 ring-white/10">
                  <Image
                    src={imagen}
                    alt={producto?.nombre ?? "Producto sin nombre"}
                    width={72}
                    height={88}
                    className="h-24 w-18 rounded-lg object-cover sm:h-24 sm:w-18"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">
                    {producto?.nombre ?? `Producto #${detalle.idProducto}`}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Categoria: {producto?.categoria ?? "Sin categoria"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Cantidad: {detalle.cantidad} | Precio unitario:{" "}
                    {formatoCOP.format(detalle.precioUnitario)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm text-slate-400">Subtotal</p>
                  <p className="text-lg font-bold text-white">
                    {formatoCOP.format(subtotal)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {esDomicilio ? (
          <div className="border-t border-white/10 bg-black/10 px-6 py-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
                <p className="text-base font-semibold text-slate-200">Entrega</p>
                <p className="mt-2 text-base text-slate-300">Tipo: Domicilio</p>
                {/* {esSeccionPendientes && (
                  <div className="mt-4">
                    <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span>Seguimiento</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {pasosDomicilio.map((paso, index) => {
                        const activo = index <= pasoDomicilioActivo;

                        return (
                          <div
                            key={`${pedido.idPedido}-${paso.label}-${index}`}
                            className={`space-y-2 ${paso.span}`}
                          >
                            <div
                              className={`h-2 rounded-full transition ${
                                activo ? "bg-sky-400" : "bg-white/10"
                              }`}
                            />
                            <p
                              className={`text-center text-sm leading-5 ${
                                activo ? "text-sky-200" : "text-slate-400"
                              }`}
                            >
                              {paso.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )} */}
                {esSeccionPendientes && (
                  <div className="mt-6 rounded-xl bg-slate-900/40 p-4 border border-slate-800/60 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      <span>Seguimiento de entrega</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 relative">
                      {pasosDomicilio.map((paso, index) => {
                        const activo = index <= pasoDomicilioActivo;
                        const esUltimoActivo = index === pasoDomicilioActivo;
                        const entregaFinalizada = pasoDomicilioActivo === 3;
                        const incidenciaEntrega = obtenerEstadoIncidenciaEntrega(entrega);
                        const pasoEnCaminoConIncidencia = index === 2 && incidenciaEntrega !== null;
                        const labelPaso = pasoEnCaminoConIncidencia ? incidenciaEntrega : paso.label;

                        return (
                          <div
                            key={`${pedido.idPedido}-${labelPaso}-${index}`}
                            className={`flex flex-col items-center space-y-3 ${paso.span}`}
                          >
                            {/* Barra indicadora con efectos de estado */}
                            <div className="w-full relative px-0.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${activo
                                    ? pasoEnCaminoConIncidencia
                                      ? "bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_14px_rgba(239,68,68,0.35)]"
                                      : entregaFinalizada
                                      ? "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_14px_rgba(74,222,128,0.35)]"
                                      : "bg-gradient-to-r from-sky-500 to-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.3)]"
                                    : "bg-slate-800"
                                  }`}
                              />
                              {esUltimoActivo && (
                                <span className="absolute -top-5 right-0 flex translate-x-1/4 items-center justify-center">
                                  <span
                                    className={`absolute inline-flex h-6 w-6 animate-ping rounded-full ${
                                      pasoEnCaminoConIncidencia
                                        ? "bg-rose-300/25"
                                        : entregaFinalizada
                                          ? "bg-emerald-300/25"
                                          : "bg-cyan-300/25"
                                    }`}
                                  />
                                  <span
                                    className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border bg-slate-950/95 shadow-[0_0_16px_rgba(56,189,248,0.28)] ${
                                      pasoEnCaminoConIncidencia
                                        ? "border-rose-300/35 text-rose-200 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
                                        : entregaFinalizada
                                        ? "border-emerald-300/35 text-emerald-200 shadow-[0_0_16px_rgba(74,222,128,0.32)]"
                                        : "border-sky-300/35 text-cyan-200 shadow-[0_0_16px_rgba(56,189,248,0.28)]"
                                    }`}
                                  >
                                    <FaMotorcycle className="h-3.5 w-3.5" />
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Texto estilizado según estado */}
                            <p
                              className={`text-center text-xs font-medium tracking-wide transition-colors duration-300 leading-4 max-w-[100px] ${esUltimoActivo
                                  ? pasoEnCaminoConIncidencia
                                    ? "text-rose-300 font-semibold"
                                    : entregaFinalizada
                                      ? "text-emerald-300 font-semibold"
                                      : "text-sky-400 font-semibold"
                                  : activo
                                    ? "text-slate-300"
                                    : "text-slate-500"
                                }`}
                            >
                              {labelPaso}
                            </p>
                            {pasoEnCaminoConIncidencia && observacionIncidencia ? (
                              <p className="max-w-[180px] text-center text-[11px] font-medium leading-4 text-rose-300">
                                {observacionIncidencia}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Domiciliario
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {obtenerNombreDomiciliario(entrega?.idDomiciliario ?? null)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Recibe
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {entrega?.nombreRecibe ?? "Sin registrar"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Direccion de entrega
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {entrega?.direccionEntrega ?? "Sin registrar"}
                    </p>
                    <p className="mt-1 text-base text-slate-400">
                      Ciudad: {entrega?.ciudad ?? "Sin registrar"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Fecha programada
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {formatearFecha(entrega?.fechaProgramada)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Fecha de asignacion
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {formatearFecha(entrega?.fechaAsignacion)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Salida
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {formatearFecha(entrega?.fechaSalida)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Entrega final
                    </p>
                    <p className="mt-2 text-base text-slate-300">
                      {formatearFecha(entrega?.fechaEntrega)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
                  <p className="text-base font-semibold text-slate-200">Pago</p>
                  {mostrarAvisoContraentrega ? (
                    <div className="mt-3 rounded-2xl border border-sky-300/20 bg-sky-400/10 px-3 py-3 text-base text-sky-100">
                      Pago contraentrega: podrás cancelar tu pedido fácilmente al recibirlo en la puerta.
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-base text-slate-300">
                        Metodo: {pago?.metodoPago ?? "Sin registrar"}
                      </p>
                      <p className="mt-1 text-base text-slate-300">
                        Estado: {pago?.estadoPago ?? "Sin registrar"}
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
                  <p className="text-base font-semibold text-slate-200">Resumen</p>
                  <p className="mt-2 text-base text-slate-300">
                    Subtotal: {formatoCOP.format(pedido.subtotal)}
                  </p>
                  <p className="mt-1 text-base text-slate-300">
                    Costo de envio: {formatoCOP.format(pedido.costoEnvio)}
                  </p>
                  <p className="mt-3 text-lg font-bold text-white">
                    Total: {formatoCOP.format(totalPedido)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 border-t border-white/10 bg-black/10 px-6 py-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
              <p className="text-base font-semibold text-slate-200">Pago</p>
              {esSeccionPendientes && (
                <div className="mt-3 rounded-2xl text-center border border-amber-300/20 bg-amber-400/10 px-3 py-3 text-base text-amber-100">
                  Recuerda pasar por tu producto en la fecha que elegiste, ¡te estaremos esperando!
                </div>
              )}
              <p className="mt-2 text-base text-slate-300">
                Metodo: {pago?.metodoPago ?? "Sin registrar"}
              </p>
              <p className="mt-1 text-base text-slate-300">
                Estado: {pago?.estadoPago ?? "Sin registrar"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
              <p className="text-base font-semibold text-slate-200">Entrega</p>
              <p className="mt-2 text-base text-slate-300">Tipo: Retiro en tienda</p>
              <p className="mt-1 text-base text-slate-300">
                Estado: {entrega?.estadoEntrega ?? "Sin registrar"}
              </p>
              <p className="mt-1 text-base text-slate-300">
                Hora de retiro: {formatearFecha(entrega?.fechaHoraRetiro)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/5">
              <p className="text-base font-semibold text-slate-200">Resumen</p>
              <p className="mt-2 text-base text-slate-300">
                Subtotal: {formatoCOP.format(pedido.subtotal)}
              </p>
              <p className="mt-3 text-lg font-bold text-white">
                Total: {formatoCOP.format(totalPedido)}
              </p>
            </div>
          </div>
        )}
      </article>
    );
  };

  const renderSeccion = (
    key: "pendientes" | "entregados" | "cancelados",
    titulo: string,
    descripcion: string,
    items: PedidoConDetalle[],
    mensajeVacio: string
  ) => (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <button
        type="button"
        onClick={() => toggleSeccion(key)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div>
          <h2 className="text-xl font-bold text-white">{titulo}</h2>
          <p className="mt-1 text-sm text-slate-300">{descripcion}</p>
          <p className="mt-2 text-sm font-semibold text-sky-300">
            {items.length} pedido{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <FaChevronDown
          className={`text-slate-300 transition ${seccionesAbiertas[key] ? "rotate-180" : ""}`}
        />
      </button>

      {seccionesAbiertas[key] && (
        <div className="border-t border-white/10 bg-black/10 px-4 py-4 sm:px-6">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
              {mensajeVacio}
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => renderPedido(item, key === "pendientes"))}
            </div>
          )}
        </div>
      )}
    </section>
  );

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Mis pedidos</h1>
            {usuarioActivo && (
              <p className="mt-2 text-sm text-slate-300">
                Hola,
                <span className="font-semibold text-white">
                  {usuarioActivo.nombre} {usuarioActivo.apellido}
                </span>
                . Aquí puedes rastrear tus productos.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md">
            <div className="inline-flex items-center justify-center rounded-full bg-slate-900 p-5 shadow-lg ring-1 ring-white/10">
              <svg
                className="size-8 animate-spin text-white"
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
            </div>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
            No tienes pedidos registrados en este momento.
          </div>
        ) : (
          <div className="space-y-6">
            {renderSeccion(
              "pendientes",
              "Productos Pendientes",
              "Sigue el estado de tus envíos a domicilio o tus retiros en tienda.",
              pedidosPendientes,
              "¡Todo en orden! No tienes envios o retiros pendientes en este momento."
            )}
            {renderSeccion(
              "entregados",
              "Productos Recibidos",
              "Historial de tus compras entregadas con éxito.",
              pedidosEntregados,
              "Aqui veras los pedidos una vez que lleguen a tus manos."
            )}
            {renderSeccion(
              "cancelados",
              "Productos Cancelados",
              "Pedidos anulados o que no pudieron concretarse.",
              pedidosCancelados,
              "No tienes pedidos cancelados."
            )}
          </div>
        )}
      </div>
    </main>
  );
}
