"use client";

import Link from "next/link";
import * as React from "react";
import {
  MdCheckCircle,
  MdCircle,
  MdInventory2,
  MdLocalShipping,
  MdMoreVert,
  MdPeople,
  MdRadioButtonUnchecked,
  MdReply,
  MdRefresh,
  MdReportProblem,
} from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import EntregaModal from "../gestionDomiciliario/entrega";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  stock: number;
  estados: string | null;
};

type PedidoProveedor = {
  id: number;
  productoId: number | null;
  cantidad: number;
  estado: string | null;
  descripcion: string | null;
  creadoEn: string | null;
};

type Pedido = {
  idPedido: number;
  idVendedor: number | null;
  fechaCreacion: string;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  total: number;
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

type Domiciliario = {
  idDomiciliario: number;
  idUsuario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
  observaciones: string | null;
};

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string | null;
  documento: string | null;
};

type Vendedor = {
  id: number;
  nombre: string | null;
  apellido: string | null;
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

type Solicitud = {
  id: number;
  nombre: string;
  correo: string;
  mensaje: string;
  respuesta: string | null;
};

type DetallePedido = {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number | null;
};

type DomiciliarioView = Domiciliario & {
  nombreCompleto: string;
  correo: string | null;
  documento: string | null;
};

type DomicilioView = Pedido & {
  entrega: Entrega | null;
  domiciliarioNombre: string | null;
  domiciliario: DomiciliarioView | null;
  vendedorNombre: string;
  pagos: Pago[];
  detalles: Array<{
    detalle: DetallePedido;
    producto: Producto | null;
  }>;
};

type TabId = "inventario" | "proveedor" | "entregas" | "quejas";

type AlertAction =
  | { kind: "link"; href: string; label: string }
  | { kind: "modal"; pedidoId: number; label: string }
  | { kind: "reply"; solicitudId: number; label: string }
  | null;

type AlertaItem = {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  accentClass: string;
  urgent: boolean;
  action: AlertAction;
  answered?: boolean;
  respuesta?: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminAlertasPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("inventario");
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [pedidosProveedor, setPedidosProveedor] = React.useState<PedidoProveedor[]>([]);
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [entregas, setEntregas] = React.useState<Entrega[]>([]);
  const [domiciliarios, setDomiciliarios] = React.useState<Domiciliario[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [vendedores, setVendedores] = React.useState<Vendedor[]>([]);
  const [pagos, setPagos] = React.useState<Pago[]>([]);
  const [detallesPedido, setDetallesPedido] = React.useState<DetallePedido[]>([]);
  const [solicitudes, setSolicitudes] = React.useState<Solicitud[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [selectedPedidoId, setSelectedPedidoId] = React.useState<number | null>(null);
  const [selectedSolicitudId, setSelectedSolicitudId] = React.useState<number | null>(null);
  const [respuestaDraft, setRespuestaDraft] = React.useState("");
  const [respondiendo, setRespondiendo] = React.useState(false);
  const [respuestaError, setRespuestaError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setCargando(true);
    try {
      const responses = await Promise.all([
        fetch("/api/productos", { cache: "no-store" }),
        fetch("/api/pedidosproveedor", { cache: "no-store" }),
        fetch("/api/pedidos", { cache: "no-store" }),
        fetch("/api/entrega", { cache: "no-store" }),
        fetch("/api/domiciliario", { cache: "no-store" }),
        fetch("/api/usuarios", { cache: "no-store" }),
        fetch("/api/vendedores", { cache: "no-store" }),
        fetch("/api/pago", { cache: "no-store" }),
        fetch("/api/detalle_pedido", { cache: "no-store" }),
        fetch("/api/solicitudes", { cache: "no-store" }),
      ]);

      const [
        productosJson,
        pedidosProveedorJson,
        pedidosJson,
        entregasJson,
        domiciliariosJson,
        usuariosJson,
        vendedoresJson,
        pagosJson,
        detallesPedidoJson,
        solicitudesJson,
      ] = await Promise.all(responses.map((response) => response.json()));

      if (productosJson.ok) setProductos(productosJson.data);
      if (pedidosProveedorJson.ok) setPedidosProveedor(pedidosProveedorJson.data);
      if (pedidosJson.ok) setPedidos(pedidosJson.data);
      if (entregasJson.ok) setEntregas(entregasJson.data);
      if (domiciliariosJson.ok) setDomiciliarios(domiciliariosJson.data);
      if (usuariosJson.ok) setUsuarios(usuariosJson.data);
      if (vendedoresJson.ok) setVendedores(vendedoresJson.data);
      if (pagosJson.ok) setPagos(pagosJson.data);
      if (detallesPedidoJson.ok) setDetallesPedido(detallesPedidoJson.data);
      if (solicitudesJson.ok) setSolicitudes(solicitudesJson.data);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const usuariosMap = React.useMemo(
    () => new Map<number, Usuario>(usuarios.map((usuario) => [usuario.id, usuario])),
    [usuarios]
  );

  const vendedoresMap = React.useMemo(
    () => new Map<number, Vendedor>(vendedores.map((vendedor) => [vendedor.id, vendedor])),
    [vendedores]
  );

  const productosPorId = React.useMemo(
    () => new Map<number, Producto>(productos.map((producto) => [producto.id, producto])),
    [productos]
  );

  const productosNombrePorId = React.useMemo(
    () => new Map<number, string>(productos.map((producto) => [producto.id, producto.nombre])),
    [productos]
  );

  const domiciliariosView = React.useMemo<DomiciliarioView[]>(
    () =>
      domiciliarios.map((domiciliario) => {
        const usuario = usuariosMap.get(domiciliario.idUsuario);
        return {
          ...domiciliario,
          nombreCompleto:
            [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || `Usuario #${domiciliario.idUsuario}`,
          correo: usuario?.correo ?? null,
          documento: usuario?.documento ?? null,
        };
      }),
    [domiciliarios, usuariosMap]
  );

  const domiciliosDetalle = React.useMemo<DomicilioView[]>(() => {
    const pagosPorPedido = new Map<number, Pago[]>();
    pagos.forEach((pago) => {
      const current = pagosPorPedido.get(pago.idPedido) ?? [];
      current.push(pago);
      pagosPorPedido.set(
        pago.idPedido,
        current.sort((left, right) => right.idPago - left.idPago)
      );
    });

    const detallesPorPedido = new Map<number, DetallePedido[]>();
    detallesPedido.forEach((detalle) => {
      const current = detallesPorPedido.get(detalle.idPedido) ?? [];
      current.push(detalle);
      detallesPorPedido.set(detalle.idPedido, current);
    });

    return pedidos
      .filter((pedido) => (pedido.tipoEntrega || "").trim().toLowerCase() === "domicilio")
      .map((pedido) => {
        const entrega = entregas.find((item) => item.idPedido === pedido.idPedido) ?? null;
        const domiciliario =
          entrega?.idDomiciliario !== null && entrega?.idDomiciliario !== undefined
            ? domiciliariosView.find((item) => item.idDomiciliario === entrega.idDomiciliario) ?? null
            : null;
        const vendedor = pedido.idVendedor ? vendedoresMap.get(pedido.idVendedor) : null;

        return {
          ...pedido,
          entrega,
          domiciliarioNombre: domiciliario?.nombreCompleto ?? null,
          domiciliario: domiciliario ?? null,
          vendedorNombre:
            vendedor
              ? [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ")
              : "Compra directa del usuario",
          pagos: pagosPorPedido.get(pedido.idPedido) ?? [],
          detalles: (detallesPorPedido.get(pedido.idPedido) ?? []).map((detalle) => ({
            detalle,
            producto: productosPorId.get(detalle.idProducto) ?? null,
          })),
        };
      });
  }, [detallesPedido, domiciliariosView, entregas, pagos, pedidos, productosPorId, vendedoresMap]);

  const domiciliosPorPedido = React.useMemo(
    () => new Map<number, DomicilioView>(domiciliosDetalle.map((pedido) => [pedido.idPedido, pedido])),
    [domiciliosDetalle]
  );

  const selectedPedido = selectedPedidoId ? domiciliosPorPedido.get(selectedPedidoId) ?? null : null;
  const selectedSolicitud = selectedSolicitudId
    ? solicitudes.find((solicitud) => solicitud.id === selectedSolicitudId) ?? null
    : null;

  const openRespuestaModal = React.useCallback(
    (solicitudId: number) => {
      const solicitud = solicitudes.find((item) => item.id === solicitudId);
      setSelectedSolicitudId(solicitudId);
      setRespuestaDraft(solicitud?.respuesta ?? "");
      setRespuestaError(null);
    },
    [solicitudes]
  );

  const handleResponderSolicitud = React.useCallback(async () => {
    if (!selectedSolicitud) return;

    const respuesta = respuestaDraft.trim();
    if (!respuesta) {
      setRespuestaError("Escribe una respuesta antes de guardar.");
      return;
    }

    setRespondiendo(true);
    setRespuestaError(null);

    try {
      const response = await fetch("/api/solicitudes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSolicitud.id, respuesta }),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo guardar la respuesta.");
      }

      setSolicitudes((current) =>
        current.map((solicitud) =>
          solicitud.id === selectedSolicitud.id ? json.data : solicitud
        )
      );
      setSelectedSolicitudId(null);
      setRespuestaDraft("");
    } catch (error) {
      setRespuestaError(error instanceof Error ? error.message : "No se pudo guardar la respuesta.");
    } finally {
      setRespondiendo(false);
    }
  }, [respuestaDraft, selectedSolicitud]);

  const alertasInventario = React.useMemo<AlertaItem[]>(
    () =>
      productos
        .filter((producto) => producto.stock < 20)
        .map((producto) => ({
          id: `inv-${producto.id}`,
          tipo: producto.stock <= 0 ? "Producto Agotado" : "Stock Bajo",
          titulo: producto.nombre,
          descripcion: `Quedan ${producto.stock} unidades en almacen.`,
          accentClass: producto.stock <= 0 ? "text-rose-500" : "text-amber-300",
          urgent: producto.stock <= 0,
          action: {
            kind: "link",
            href: "/user/admin/products",
            label: "Solicitar Pedido",
          },
        })),
    [productos]
  );

  const alertasProveedor = React.useMemo<AlertaItem[]>(
    () =>
      pedidosProveedor.map((pedido) => {
        const estado = (pedido.estado || "Pendiente").toLowerCase();
        const producto = pedido.productoId
          ? productosNombrePorId.get(pedido.productoId) ?? `Producto #${pedido.productoId}`
          : "Producto no identificado";

        return {
          id: `prov-${pedido.id}`,
          tipo:
            estado === "aceptado"
              ? "Pedido Aceptado"
              : estado === "rechazado"
                ? "Pedido Rechazado"
                : "Pedido Pendiente",
          titulo: producto,
          descripcion: pedido.descripcion?.trim() || `Solicitud de ${pedido.cantidad} unidades para ${producto}.`,
          accentClass: estado === "rechazado" ? "text-rose-500" : "text-emerald-300",
          urgent: estado === "rechazado",
          action: null,
        };
      }),
    [pedidosProveedor, productosNombrePorId]
  );

  const alertasEntregas = React.useMemo<AlertaItem[]>(
    () =>
      domiciliosDetalle.flatMap((pedido) => {
        const entrega = pedido.entrega;
        const estadoEntrega = entrega?.estadoEntrega?.trim() || "Pendiente";
        const estado = estadoEntrega.toLowerCase();
        const destino = entrega?.ciudad || entrega?.direccionEntrega || "Entrega a domicilio";

        if (estado === "pendiente") {
          return [{
            id: `ent-${pedido.idPedido}`,
            tipo: "Entrega Pendiente",
            titulo: `Pedido #${pedido.idPedido}`,
            descripcion: `${destino}. Este domicilio esta pendiente de gestion.`,
            accentClass: "text-violet-300",
            urgent: true,
            action: {
              kind: "link",
              href: `/user/admin/gestionDomiciliario?pedido=${pedido.idPedido}`,
              label: "Asignar entrega",
            },
          }];
        }

        return [];
      }),
    [domiciliosDetalle]
  );

  const alertasCliente = React.useMemo<AlertaItem[]>(
    () =>
      solicitudes.map((solicitud) => {
        const respondida = Boolean(solicitud.respuesta?.trim());

        return {
          id: `sol-${solicitud.id}`,
          tipo: respondida ? "Solicitud Respondida" : "Solicitud Pendiente",
          titulo: solicitud.nombre,
          descripcion: `${solicitud.correo} - ${solicitud.mensaje}`,
          accentClass: respondida ? "text-emerald-300" : "text-rose-300",
          urgent: !respondida,
          action: {
            kind: "reply",
            solicitudId: solicitud.id,
            label: respondida ? "Editar respuesta" : "Responder",
          },
          answered: respondida,
          respuesta: solicitud.respuesta,
        };
      }),
    [solicitudes]
  );
  const solicitudesPendientesCount = React.useMemo(
    () => solicitudes.filter((solicitud) => !solicitud.respuesta?.trim()).length,
    [solicitudes]
  );

  const tabs = [
    { id: "inventario", label: "Inventario", icon: <MdInventory2 />, activeColor: "text-cyan-400", glow: "shadow-cyan-500/20", count: alertasInventario.length },
    { id: "proveedor", label: "Suministros", icon: <MdPeople />, activeColor: "text-emerald-400", glow: "shadow-emerald-500/20", count: alertasProveedor.length },
    { id: "entregas", label: "Entregas", icon: <MdLocalShipping />, activeColor: "text-purple-400", glow: "shadow-purple-500/20", count: alertasEntregas.length },
    { id: "quejas", label: "Atencion al Cliente", icon: <MdReportProblem />, activeColor: "text-rose-400", glow: "shadow-rose-500/20", count: solicitudesPendientesCount },
  ] as const;

  const data =
    activeTab === "inventario"
      ? alertasInventario
      : activeTab === "proveedor"
        ? alertasProveedor
        : activeTab === "entregas"
          ? alertasEntregas
          : alertasCliente;

  const totalRegistros =
    alertasInventario.length + alertasProveedor.length + alertasEntregas.length + solicitudesPendientesCount;

  return (
    <main className="min-h-screen bg-[#0a0c10] font-sans text-slate-300 selection:bg-cyan-500/30">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/60 bg-[#0d1117]/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 p-1">
            <button
              type="button"
              onClick={fetchData}
              disabled={cargando}
              className="rounded-md p-1.5 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdRefresh className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
            </button>
            <button className="rounded-md p-1.5 transition-colors hover:bg-slate-700">
              <MdMoreVert className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-[10px] font-mono tracking-tighter text-slate-500">
          Registros: {totalRegistros}
        </div>
      </div>

      <nav className="flex w-full border-b border-slate-800/60 bg-[#0d1117]/40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-3 px-4 py-4 text-center text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                isActive ? `${tab.activeColor} bg-slate-800/20` : "text-slate-500 hover:bg-slate-800/10 hover:text-slate-300"
              }`}
            >
              <span className={`text-lg ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`}>{tab.icon}</span>
              {tab.label}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
                  isActive ? "bg-current/15 text-current" : "bg-slate-800 text-slate-300"
                }`}
              >
                {tab.count}
              </span>
              {isActive && (
                <>
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-current shadow-lg ${tab.glow}`} />
                  <MdCircle className="absolute -bottom-1 left-1/2 -translate-x-1/2 animate-pulse text-[6px]" />
                </>
              )}
            </button>
          );
        })}
      </nav>

      <section className="mx-auto mt-2 max-w-[1400px] px-2">
        <div className="overflow-hidden rounded-xl border border-slate-800/50 bg-[#0d1117]/60 shadow-2xl backdrop-blur-sm">
          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-4 py-32">
              <FaSpinner className="animate-spin text-3xl text-cyan-500" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Cargando</span>
            </div>
          ) : data.length === 0 ? (
            <div className="py-20 text-center text-slate-500 animate-pulse">
              <p className="text-lg font-light tracking-widest">Bandeja Vacia</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/50">
              {data.map((item) => (
                <li key={item.id} className="group px-6 py-4 transition-all duration-200 hover:bg-slate-800/40">
                  <div className="flex items-center gap-4">
                    {item.answered ? (
                      <MdCheckCircle className="shrink-0 text-xl text-emerald-400 transition-colors group-hover:text-emerald-300" />
                    ) : (
                      <MdRadioButtonUnchecked className="shrink-0 text-slate-600 transition-colors group-hover:text-slate-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className={`text-sm font-bold uppercase tracking-wider ${item.accentClass}`}>{item.tipo}</span>
                        <span className="text-base font-medium text-white">{item.titulo}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{item.descripcion}</p>
                      {item.respuesta && (
                        <p className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-100">
                          {item.respuesta}
                        </p>
                      )}
                    </div>
                    {item.action?.kind === "link" && (
                      <Link
                        href={item.action.href}
                        className={`rounded-lg px-3 py-2 text-xs font-bold tracking-wider transition ${
                          activeTab === "inventario"
                            ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:text-cyan-200"
                            : "border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:border-violet-400/50 hover:bg-violet-500/20 hover:text-violet-200"
                        }`}
                      >
                        {item.action.label}
                      </Link>
                    )}
                    {item.action?.kind === "modal" && (
                      <button
                        type="button"
                        onClick={() => setSelectedPedidoId(item.action?.kind === "modal" ? item.action.pedidoId : null)}
                        className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-bold tracking-wider text-sky-300 transition hover:border-sky-400/50 hover:bg-sky-500/20 hover:text-sky-200"
                      >
                        {item.action.label}
                      </button>
                    )}
                    {item.action?.kind === "reply" && (
                      <button
                        type="button"
                        onClick={() => openRespuestaModal(item.action?.kind === "reply" ? item.action.solicitudId : 0)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold tracking-wider text-rose-300 transition hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-200"
                      >
                        <MdReply className="text-base" />
                        {item.action.label}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selectedPedido && (
        <EntregaModal
          pedido={selectedPedido}
          activeDomiciliarios={[]}
          assigningPedidoId={null}
          formatDate={formatDate}
          onAssignEntrega={() => {}}
          onClose={() => setSelectedPedidoId(null)}
          readOnly
        />
      )}

      {selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-[#0d1117] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-300">Atencion al cliente</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{selectedSolicitud.nombre}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedSolicitud.correo}</p>
              </div>
              {selectedSolicitud.respuesta && <MdCheckCircle className="text-2xl text-emerald-400" />}
            </div>

            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              {selectedSolicitud.mensaje}
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-widest text-slate-500" htmlFor="respuesta-solicitud">
              Respuesta
            </label>
            <textarea
              id="respuesta-solicitud"
              value={respuestaDraft}
              onChange={(event) => setRespuestaDraft(event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-rose-400"
              placeholder="Escribe la respuesta para el cliente"
            />
            {respuestaError && <p className="mt-2 text-sm text-rose-300">{respuestaError}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedSolicitudId(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResponderSolicitud}
                disabled={respondiendo}
                className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {respondiendo ? "Guardando..." : "Guardar respuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
