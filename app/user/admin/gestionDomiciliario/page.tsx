"use client";

import * as React from "react";
import { FaSpinner } from "react-icons/fa";

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
  const [domiciliarios, setDomiciliarios] = React.useState<Domiciliario[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [entregas, setEntregas] = React.useState<Entrega[]>([]);
  const [vendedores, setVendedores] = React.useState<Vendedor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingDomiciliarioId, setSavingDomiciliarioId] = React.useState<number | null>(null);
  const [assigningPedidoId, setAssigningPedidoId] = React.useState<number | null>(null);
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [detailPedido, setDetailPedido] = React.useState<DomicilioView | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [domiciliariosRes, usuariosRes, pedidosRes, entregasRes, vendedoresRes] =
          await Promise.all([
            fetch("/api/domiciliario", { cache: "no-store" }),
            fetch("/api/usuarios", { cache: "no-store" }),
            fetch("/api/pedidos", { cache: "no-store" }),
            fetch("/api/entrega", { cache: "no-store" }),
            fetch("/api/vendedores", { cache: "no-store" }),
          ]);

        const [domiciliariosJson, usuariosJson, pedidosJson, entregasJson, vendedoresJson] =
          await Promise.all([
            domiciliariosRes.json(),
            usuariosRes.json(),
            pedidosRes.json(),
            entregasRes.json(),
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
        if (!vendedoresRes.ok || !vendedoresJson?.ok) {
          throw new Error(vendedoresJson?.error ?? `HTTP ${vendedoresRes.status}`);
        }

        if (!cancelled) {
          setDomiciliarios(domiciliariosJson.data as Domiciliario[]);
          setUsuarios(usuariosJson.data as Usuario[]);
          setPedidos(pedidosJson.data as Pedido[]);
          setEntregas(entregasJson.data as Entrega[]);
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
    () =>
      pedidos
        .filter((pedido) => normalizeText(pedido.tipoEntrega) === "domicilio")
        .map((pedido) => {
          const entrega = entregas.find((item) => item.idPedido === pedido.idPedido) ?? null;
          const domiciliario =
            entrega?.idDomiciliario !== null && entrega?.idDomiciliario !== undefined
              ? domiciliariosView.find((item) => item.idDomiciliario === entrega.idDomiciliario)
              : null;

          return {
            ...pedido,
            entrega,
            domiciliarioNombre: domiciliario?.nombreCompleto ?? null,
          };
        }),
    [pedidos, entregas, domiciliariosView]
  );

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
            ? { ...item, estadoLaboral: json.data.estadoLaboral as string }
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
      if (pedido.entrega) {
        const res = await fetch(`/api/entrega/${pedido.entrega.idEntrega}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idDomiciliario,
            fechaAsignacion: new Date().toISOString(),
            estadoEntrega: "asignada",
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }

        setEntregas((prev) =>
          prev.map((item) => (item.idEntrega === json.data.idEntrega ? (json.data as Entrega) : item))
        );
      } else {
        const res = await fetch("/api/entrega", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idPedido: pedido.idPedido,
            idDomiciliario,
            costoEnvio: 0,
            estadoEntrega: "asignada",
            fechaAsignacion: new Date().toISOString(),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }

        setEntregas((prev) => [json.data as Entrega, ...prev]);
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
  };

  return (
    <section className="mx-auto max-w-7xl space-y-8 text-white">
      <header className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">Operaciones</p>
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
              activeModal === "domicilios" ? "max-w-5xl" : "max-w-3xl"
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
                    <table className="w-full table-fixed text-sm">
                      <thead className="sticky top-0 bg-slate-950 text-left text-white/65">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Nombre</th>
                          <th className="px-6 py-3 font-semibold">Correo</th>
                          <th className="px-6 py-3 font-semibold">Documento</th>
                          <th className="px-6 py-3 font-semibold">Estado laboral</th>
                          <th className="px-6 py-3 font-semibold">Disponibilidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-white/85">
                        {domiciliariosView.map((domiciliario) => (
                          <tr key={domiciliario.idDomiciliario} className="transition hover:bg-white/6">
                            <td className="px-6 py-4">{domiciliario.nombreCompleto}</td>
                            <td className="px-6 py-4 text-white/70">{domiciliario.correo ?? "-"}</td>
                            <td className="px-6 py-4 text-white/70">{domiciliario.documento ?? "-"}</td>
                            <td className="px-6 py-4">
                              <select
                                value={domiciliario.estadoLaboral}
                                onChange={(event) => updateEstadoLaboral(domiciliario, event.target.value)}
                                disabled={savingDomiciliarioId === domiciliario.idDomiciliario}
                                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-white outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
                              >
                                {ESTADOS_LABORALES.map((estado) => (
                                  <option key={estado} value={estado}>
                                    {estado}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-white/70">{domiciliario.disponibilidadManual}</td>
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
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                  <div className="overflow-y-auto pr-2">
                    <table className="w-full table-fixed text-sm">
                      <thead className="sticky top-0 bg-slate-950 text-left text-white/65">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Pedido</th>
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Domiciliario</th>
                          <th className="px-4 py-3 font-semibold">Estado entrega</th>
                          <th className="px-4 py-3 font-semibold">Asignar</th>
                          <th className="px-4 py-3 font-semibold">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-white/85">
                        {domicilios.map((pedido) => {
                          const entrega = pedido.entrega;
                          const estadoEntrega = entrega?.estadoEntrega ?? "pendiente";

                          return (
                            <tr key={pedido.idPedido} className="transition hover:bg-white/6">
                              <td className="px-4 py-4">
                                <p className="font-semibold text-white">Pedido #{pedido.idPedido}</p>
                                <p className="mt-1 text-xs text-white/55">
                                  {pedido.estadoPedido ?? "Sin estado"}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-white/70">{formatDate(pedido.fechaCreacion)}</td>
                              <td className="px-4 py-4 text-white/70">{pedido.domiciliarioNombre ?? "Sin asignar"}</td>
                              <td className="px-4 py-4">
                                <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                                  {estadoEntrega}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={entrega?.idDomiciliario ?? ""}
                                  onChange={(event) => {
                                    const value = Number(event.target.value);
                                    if (Number.isInteger(value) && value > 0) {
                                      void assignEntrega(pedido, value);
                                    }
                                  }}
                                  disabled={assigningPedidoId === pedido.idPedido || activeDomiciliarios.length === 0}
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
                                >
                                  <option value="">Selecciona un domiciliario</option>
                                  {activeDomiciliarios.map((domiciliario) => (
                                    <option key={domiciliario.idDomiciliario} value={domiciliario.idDomiciliario}>
                                      {domiciliario.nombreCompleto}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => setDetailPedido(pedido)}
                                  className="inline-flex rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                  Ver mas
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailPedido && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => setDetailPedido(null)}
              className="absolute right-5 top-5 text-white/45 transition hover:text-white"
            >
              X
            </button>

            <div className="border-b border-white/10 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Detalle de entrega</p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight">
                Pedido #{detailPedido.idPedido}
              </h2>
            </div>

            <div className="space-y-4 px-6 py-6 text-sm text-white/75 sm:px-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Estado pedido</span>
                  {detailPedido.estadoPedido ?? "-"}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Estado entrega</span>
                  {detailPedido.entrega?.estadoEntrega ?? "pendiente"}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Direccion</span>
                  {detailPedido.entrega?.direccionEntrega ?? "-"}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Ciudad</span>
                  {detailPedido.entrega?.ciudad ?? "-"}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Contacto</span>
                  {detailPedido.entrega?.telefonoContacto ?? "-"}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Recibe</span>
                  {detailPedido.entrega?.nombreRecibe ?? "-"}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Fecha programada</span>
                  {formatDate(detailPedido.entrega?.fechaProgramada ?? null)}
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Costo envio</span>
                  ${Number(detailPedido.entrega?.costoEnvio ?? 0).toLocaleString("es-CO")}
                </div>
              </div>

              <div>
                <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">Observacion</span>
                {detailPedido.entrega?.observacion ?? "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex min-h-[220px] flex-col rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-200/90">Domiciliarios</p>
          <p className="mx-auto mt-4 max-w-sm flex-1 text-sm leading-6 text-white/65">Consulta el listado de domiciliarios disponibles y revisa cuáles se encuentran activos actualmente.</p>
          <button
            type="button"
            onClick={() => setActiveModal("domiciliarios")}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center self-center rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-2 font-semibold text-sky-100 transition hover:bg-sky-400/20"
          >
            Ver listado de domiciliarios
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/90">Retiros en tienda</p>
          <p className="mx-auto mt-4 max-w-sm flex-1 text-sm leading-6 text-white/65">Listado de pedidos retirados o pendientes</p>
          <button
            type="button"
            onClick={() => setActiveModal("retiros")}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center self-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Ver retiros en tienda
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/90">Domicilios</p>
          <p className="mx-auto mt-4 max-w-sm flex-1 text-sm leading-6 text-white/65">Consulta las entregas a domicilio pendientes de asignación y haz seguimiento.
          </p>
          <button
            type="button"
            onClick={() => setActiveModal("domicilios")}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center self-center rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 font-semibold text-amber-100 transition hover:bg-amber-400/20"
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
