"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import AsignarDomicilio from "./asignarDomicilio";
import EntregaModal from "./entrega";
import HorarioDomiciliario from "./horarioDomiciliario";

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

type Pedido = {
  idPedido: number;
  idVendedor: number | null;
  fechaCreacion: string;
  tipoEntrega: string | null;
  estadoPedido: string | null;
  total: number;
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

type Vendedor = {
  id: number;
  nombre: string | null;
  apellido: string | null;
};

type DomiciliarioView = Domiciliario & {
  nombreCompleto: string;
  correo: string | null;
  documento: string | null;
};

type RetiroView = Pedido & {
  vendedorNombre: string;
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

const ESTADOS_LABORALES = ["Activo", "Inactivo", "Suspendido"];

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

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

type ModalType = "domiciliarios" | "retiros" | "domicilios" | null;

export default function GestionDomiciliarioPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [domiciliarios, setDomiciliarios] = React.useState<Domiciliario[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [entregas, setEntregas] = React.useState<Entrega[]>([]);
  const [pagos, setPagos] = React.useState<Pago[]>([]);
  const [detallesPedido, setDetallesPedido] = React.useState<DetallePedido[]>([]);
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [vendedores, setVendedores] = React.useState<Vendedor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingDomiciliarioId, setSavingDomiciliarioId] = React.useState<number | null>(null);
  const [assigningPedidoId, setAssigningPedidoId] = React.useState<number | null>(null);
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [detailPedido, setDetailPedido] = React.useState<DomicilioView | null>(null);
  const [horarioDomiciliario, setHorarioDomiciliario] = React.useState<DomiciliarioView | null>(null);

  const pedidoParam = searchParams.get("pedido");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          domiciliariosRes,
          usuariosRes,
          pedidosRes,
          entregasRes,
          pagosRes,
          detallesPedidoRes,
          productosRes,
          vendedoresRes,
        ] =
          await Promise.all([
            fetch("/api/domiciliario", { cache: "no-store" }),
            fetch("/api/usuarios", { cache: "no-store" }),
            fetch("/api/pedidos", { cache: "no-store" }),
            fetch("/api/entrega", { cache: "no-store" }),
            fetch("/api/pago", { cache: "no-store" }),
            fetch("/api/detalle_pedido", { cache: "no-store" }),
            fetch("/api/productos", { cache: "no-store" }),
            fetch("/api/vendedores", { cache: "no-store" }),
          ]);

        const [
          domiciliariosJson,
          usuariosJson,
          pedidosJson,
          entregasJson,
          pagosJson,
          detallesPedidoJson,
          productosJson,
          vendedoresJson,
        ] =
          await Promise.all([
            domiciliariosRes.json(),
            usuariosRes.json(),
            pedidosRes.json(),
            entregasRes.json(),
            pagosRes.json(),
            detallesPedidoRes.json(),
            productosRes.json(),
            vendedoresRes.json(),
          ]);

        if (!domiciliariosRes.ok || !domiciliariosJson?.ok) {
          throw new Error(domiciliariosJson?.error ?? `HTTP ${domiciliariosRes.status}`);
        }
        if (!usuariosRes.ok || !usuariosJson?.ok) {
          throw new Error(usuariosJson?.error ?? `HTTP ${usuariosRes.status}`);
        }
        if (!pedidosRes.ok || !pedidosJson?.ok) {
          throw new Error(pedidosJson?.error ?? `HTTP ${pedidosRes.status}`);
        }
        if (!entregasRes.ok || !entregasJson?.ok) {
          throw new Error(entregasJson?.error ?? `HTTP ${entregasRes.status}`);
        }
        if (!pagosRes.ok || !pagosJson?.ok) {
          throw new Error(pagosJson?.error ?? `HTTP ${pagosRes.status}`);
        }
        if (!detallesPedidoRes.ok || !detallesPedidoJson?.ok) {
          throw new Error(detallesPedidoJson?.error ?? `HTTP ${detallesPedidoRes.status}`);
        }
        if (!productosRes.ok || !productosJson?.ok) {
          throw new Error(productosJson?.error ?? `HTTP ${productosRes.status}`);
        }
        if (!vendedoresRes.ok || !vendedoresJson?.ok) {
          throw new Error(vendedoresJson?.error ?? `HTTP ${vendedoresRes.status}`);
        }

        if (!cancelled) {
          setDomiciliarios(domiciliariosJson.data as Domiciliario[]);
          setUsuarios(usuariosJson.data as Usuario[]);
          setPedidos(pedidosJson.data as Pedido[]);
          setEntregas(entregasJson.data as Entrega[]);
          setPagos(pagosJson.data as Pago[]);
          setDetallesPedido(detallesPedidoJson.data as DetallePedido[]);
          setProductos(productosJson.data as Producto[]);
          setVendedores(vendedoresJson.data as Vendedor[]);
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Error al cargar gestion de entregas");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const usuariosMap = React.useMemo(
    () => new Map<number, Usuario>(usuarios.map((usuario) => [usuario.id, usuario])),
    [usuarios]
  );

  const vendedoresMap = React.useMemo(
    () => new Map<number, Vendedor>(vendedores.map((vendedor) => [vendedor.id, vendedor])),
    [vendedores]
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

  const retiros = React.useMemo<RetiroView[]>(
    () =>
      pedidos
        .filter((pedido) => normalizeText(pedido.tipoEntrega) !== "domicilio")
        .map((pedido) => {
          const vendedor = pedido.idVendedor ? vendedoresMap.get(pedido.idVendedor) : null;
          return {
            ...pedido,
            vendedorNombre:
              vendedor
                ? [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ")
                : "Compra directa del usuario",
          };
        }),
    [pedidos, vendedoresMap]
  );

  const domicilios = React.useMemo<DomicilioView[]>(
    () => {
      const pagosPorPedido = new Map<number, Pago[]>();
      pagos.forEach((pago) => {
        const current = pagosPorPedido.get(pago.idPedido) ?? [];
        current.push(pago);
        pagosPorPedido.set(
          pago.idPedido,
          current.sort((left, right) => right.idPago - left.idPago)
        );
      });

      const productosMap = new Map<number, Producto>(
        productos.map((producto) => [producto.id, producto])
      );

      const detallesPorPedido = new Map<number, DetallePedido[]>();
      detallesPedido.forEach((detalle) => {
        const current = detallesPorPedido.get(detalle.idPedido) ?? [];
        current.push(detalle);
        detallesPorPedido.set(detalle.idPedido, current);
      });

      return pedidos
        .filter((pedido) => normalizeText(pedido.tipoEntrega) === "domicilio")
        .map((pedido) => {
          const entrega = entregas.find((item) => item.idPedido === pedido.idPedido) ?? null;
          const domiciliario =
            entrega?.idDomiciliario !== null && entrega?.idDomiciliario !== undefined
              ? domiciliariosView.find((item) => item.idDomiciliario === entrega.idDomiciliario)
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
              producto: productosMap.get(detalle.idProducto) ?? null,
            })),
          };
        });
    },
    [pedidos, entregas, domiciliariosView, pagos, detallesPedido, productos, vendedoresMap]
  );

  const pedidoSolicitadoId = React.useMemo(() => {
    if (!pedidoParam) return null;
    const parsed = Number(pedidoParam);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [pedidoParam]);

  const clearPedidoQuery = React.useCallback(() => {
    if (!pedidoParam) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("pedido");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, pedidoParam, router, searchParams]);

  React.useEffect(() => {
    if (loading || pedidoSolicitadoId === null) return;
    const pedidoSolicitado = domicilios.find((item) => item.idPedido === pedidoSolicitadoId);
    if (!pedidoSolicitado) return;

    setActiveModal(null);
    setDetailPedido((prev) => (prev?.idPedido === pedidoSolicitado.idPedido ? prev : pedidoSolicitado));
    clearPedidoQuery();
  }, [clearPedidoQuery, domicilios, loading, pedidoSolicitadoId]);

  const activeDomiciliarios = React.useMemo(
    () => domiciliariosView.filter((item) => normalizeText(item.estadoLaboral) === "activo"),
    [domiciliariosView]
  );

  const updateEstadoLaboral = async (domiciliario: DomiciliarioView, estadoLaboral: string) => {
    setSavingDomiciliarioId(domiciliario.idDomiciliario);
    setError(null);

    try {
      const res = await fetch(`/api/domiciliario/${domiciliario.idDomiciliario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoLaboral }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      setDomiciliarios((prev) =>
        prev.map((item) =>
          item.idDomiciliario === domiciliario.idDomiciliario
            ? {
                ...item,
                estadoLaboral: json.data.estadoLaboral as string,
                disponibilidadManual: json.data.disponibilidadManual as string,
              }
            : item
        )
      );
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Error al actualizar domiciliario");
    } finally {
      setSavingDomiciliarioId(null);
    }
  };

  const assignEntrega = async (pedido: DomicilioView, idDomiciliario: number) => {
    setAssigningPedidoId(pedido.idPedido);
    setError(null);

    try {
      const domiciliarioAsignado =
        domiciliariosView.find((item) => item.idDomiciliario === idDomiciliario) ?? null;

      if (pedido.entrega) {
        const res = await fetch(`/api/entrega/${pedido.entrega.idEntrega}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idDomiciliario,
            fechaAsignacion: new Date().toISOString(),
            estadoEntrega: "Asignada",
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }

        setEntregas((prev) =>
          prev.map((item) => (item.idEntrega === json.data.idEntrega ? (json.data as Entrega) : item))
        );
        setDetailPedido((prev) =>
          prev && prev.idPedido === pedido.idPedido
            ? {
                ...prev,
                entrega: json.data as Entrega,
                domiciliarioNombre: domiciliarioAsignado?.nombreCompleto ?? null,
                domiciliario: domiciliarioAsignado,
              }
            : prev
        );
      } else {
        const res = await fetch("/api/entrega", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idPedido: pedido.idPedido,
            idDomiciliario,
            costoEnvio: 0,
            estadoEntrega: "Asignada",
            fechaAsignacion: new Date().toISOString(),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }

        setEntregas((prev) => [json.data as Entrega, ...prev]);
        setDetailPedido((prev) =>
          prev && prev.idPedido === pedido.idPedido
            ? {
                ...prev,
                entrega: json.data as Entrega,
                domiciliarioNombre: domiciliarioAsignado?.nombreCompleto ?? null,
                domiciliario: domiciliarioAsignado,
              }
            : prev
        );
      }
    } catch (assignError: unknown) {
      setError(assignError instanceof Error ? assignError.message : "Error al asignar la entrega");
    } finally {
      setAssigningPedidoId(null);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setDetailPedido(null);
    setHorarioDomiciliario(null);
  };

  const closeDetailPedido = React.useCallback(() => {
    setDetailPedido(null);
    clearPedidoQuery();
  }, [clearPedidoQuery]);

  return (
    <section className="mx-auto max-w-7xl space-y-8 text-white">
      <header className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Gestion de domiciliarios y entregas
        </h1>
        <p className="mx-auto mt-4 max-w-4xl text-sm leading-7 text-white/75 sm:text-base">
          Accede al listado de domiciliarios y administra las entregas desde un solo lugar. Aqui­ puedes consultar asignaciones, revisar pedidos para retiro en tienda y hacer seguimiento al estado de los domicilios pendientes.
        </p>
      </header>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div
            className={`relative w-full rounded-[2rem] border border-white/10 bg-slate-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
              activeModal === "domicilios"
                ? "max-w-5xl"
                : activeModal === "domiciliarios"
                  ? "max-w-6xl"
                  : "max-w-3xl"
            }`}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-5 top-5 text-white/45 transition hover:text-white"
            >
              X
            </button>

            <div className="border-b border-white/10 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                {activeModal === "domiciliarios"
                  ? "Listado"
                  : activeModal === "retiros"
                    ? "Retiro en tienda"
                    : "Asignacion"}
              </p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight">
                {activeModal === "domiciliarios"
                  ? "Domiciliarios"
                  : activeModal === "retiros"
                    ? "Pedidos por retiro en tienda"
                    : "Entregas a domicilio"}
              </h2>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-6 sm:px-8">
              {activeModal === "domiciliarios" && (
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                  <div className="overflow-y-auto pr-2">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-950 text-left text-white/65">
                        <tr>
                          <th className="w-[18%] px-6 py-3 font-semibold">Nombre</th>
                          <th className="w-[24%] px-6 py-3 font-semibold">Correo</th>
                          <th className="w-[12%] px-6 py-3 font-semibold">Documento</th>
                          <th className="w-[16%] px-6 py-3 font-semibold">Estado laboral</th>
                          <th className="w-[14%] px-6 py-3 font-semibold">Disponibilidad</th>
                          <th className="w-[16%] px-6 py-3 font-semibold">Horarios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-white/85">
                        {domiciliariosView.map((domiciliario) => (
                          <tr key={domiciliario.idDomiciliario} className="transition hover:bg-white/6">
                            <td className="px-6 py-4 align-middle">{domiciliario.nombreCompleto}</td>
                            <td className="px-6 py-4 align-middle text-white/70">{domiciliario.correo ?? "-"}</td>
                            <td className="px-6 py-4 align-middle text-white/70">{domiciliario.documento ?? "-"}</td>
                            <td className="px-6 py-4 align-middle">
                              <select
                                value={domiciliario.estadoLaboral}
                                onChange={(event) => updateEstadoLaboral(domiciliario, event.target.value)}
                                disabled={savingDomiciliarioId === domiciliario.idDomiciliario}
                                className="w-full min-w-[130px] rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
                              >
                                {ESTADOS_LABORALES.map((estado) => (
                                  <option key={estado} value={estado}>
                                    {estado}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 align-middle text-white/70">{domiciliario.disponibilidadManual}</td>
                            <td className="px-6 py-4 align-middle">
                              <button
                                type="button"
                                onClick={() => setHorarioDomiciliario(domiciliario)}
                                className="inline-flex rounded-2xl border border-cyan-200/70 bg-cyan-500 px-5 py-3 text-xs font-bold text-white transition hover:scale-[1.02] hover:bg-cyan-400"
                              >
                                Asignar Horarios
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModal === "retiros" && (
                <div className="space-y-3">
                    {retiros.map((pedido) => (
                      <div
                        key={pedido.idPedido}
                        className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-center"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="sm:text-left">
                            <p className="text-sm font-semibold text-white">Pedido #{pedido.idPedido}</p>
                            <p className="mt-1 text-sm text-white/60">Vendedor: {pedido.vendedorNombre}</p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-sm text-white/60">Fecha</p>
                            <p className="text-sm text-white">{formatDate(pedido.fechaCreacion)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                          <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                            {pedido.estadoPedido ?? "Sin estado"}
                          </span>
                          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                            Retiro en tienda
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {activeModal === "domicilios" && (
                <AsignarDomicilio
                  domicilios={domicilios}
                  formatDate={formatDate}
                  onViewDetail={setDetailPedido}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {detailPedido && (
        <EntregaModal
          pedido={detailPedido}
          activeDomiciliarios={activeDomiciliarios}
          assigningPedidoId={assigningPedidoId}
          formatDate={formatDate}
          onAssignEntrega={(idDomiciliario) => {
            void assignEntrega(detailPedido, idDomiciliario);
          }}
          onClose={closeDetailPedido}
        />
      )}

      {horarioDomiciliario && (
        <HorarioDomiciliario
          domiciliario={{
            idDomiciliario: horarioDomiciliario.idDomiciliario,
            nombreCompleto: horarioDomiciliario.nombreCompleto,
            disponibilidadManual: horarioDomiciliario.disponibilidadManual,
          }}
          onClose={() => setHorarioDomiciliario(null)}
        />
      )}

      {error && (
        <div className="rounded-[2rem] border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex min-h-[220px] flex-col rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-sky-200/90">Domiciliarios</p>
          <p className="mx-auto mt-4 max-w-sm flex-1 text-sm leading-6 text-white/65">Consulta el listado de domiciliarios disponibles y revisa cuáles se encuentran activos actualmente.</p>
          <button
            type="button"
            onClick={() => setActiveModal("domiciliarios")}
            className="mt-6 inline-flex min-h-[52px] items-center justify-center self-center rounded-2xl border border-cyan-200/70 bg-cyan-500 px-6 py-3 text-lg font-extrabold text-white transition hover:scale-[1.02] hover:bg-cyan-400"
          >
            Ver listado de domiciliarios
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-emerald-200/90">Retiros en tienda</p>
          <p className="mx-auto mt-4 max-w-sm flex-1 text-sm leading-6 text-white/65">Listado de pedidos retirados o pendientes</p>
          <button
            type="button"
            onClick={() => setActiveModal("retiros")}
            className="mt-6 inline-flex min-h-[52px] items-center justify-center self-center rounded-2xl border border-sky-200/70 bg-amber-500 px-6 py-3 text-lg font-extrabold text-white transition hover:scale-[1.02] hover:bg-sky-400"
          >
            Ver retiros en tienda
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-base font-medium uppercase tracking-[0.24em] text-amber-200/90">Domicilios</p>
          <p className="mx-auto mt-4 max-w-sm flex-1 text-sm leading-6 text-white/65">Consulta las entregas a domicilio pendientes de asignación y haz seguimiento.
          </p>
          <button
            type="button"
            onClick={() => setActiveModal("domicilios")}
            className="mt-6 inline-flex min-h-[52px] items-center justify-center self-center rounded-2xl border border-cyan-200/70 bg-cyan-500 px-6 py-3 text-lg font-extrabold text-white transition hover:scale-[1.02] hover:bg-cyan-400"
          >
            Asignar domiciliario
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-[2rem] border border-white/10 bg-white/10 px-6 py-10 text-center text-white/65 backdrop-blur-md">
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin text-xl text-sky-200" />
            <span>Cargando gestion de entregas...</span>
          </div>
        </div>
      )}
    </section>
  );
}
