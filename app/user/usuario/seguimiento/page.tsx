"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Usuario = {
  id: number;
  nombre: string;
  apellido?: string;
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

export default function Page() {
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null);
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const [pedidosRaw, detallesRaw, pagosRaw, entregasRaw] = await Promise.all([
          fetchJson<Pedido[]>("/api/pedidos"),
          fetchJson<DetallePedido[]>("/api/detalle_pedido"),
          fetchJson<Pago[]>("/api/pago"),
          fetchJson<Entrega[]>("/api/entrega"),
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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis pedidos</h1>
            {usuarioActivo && (
              <p className="mt-2 text-sm text-gray-500">
                Seguimiento de pedidos de{" "}
                <span className="font-semibold text-gray-700">
                  {usuarioActivo.nombre} {usuarioActivo.apellido}
                </span>
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Pedidos registrados</p>
            <p className="text-2xl font-bold text-gray-900">{totalPedidos}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              />
            ))}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-black/5">
            No tienes pedidos registrados en este momento.
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map(({ pedido, detalles, pago, entrega }) => (
              <article
                key={pedido.idPedido}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Pedido realizado</h2>
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
                        className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center justify-center rounded-xl bg-white p-2">
                          <Image
                            src={imagen}
                            alt={producto?.nombre ?? "Producto sin nombre"}
                            width={96}
                            height={120}
                            className="h-32 w-24 rounded-lg object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {producto?.nombre ?? `Producto #${detalle.idProducto}`}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Categoria: {producto?.categoria ?? "Sin categoria"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Cantidad: {detalle.cantidad} | Precio unitario:{" "}
                            {formatoCOP.format(detalle.precioUnitario)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatoCOP.format(subtotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-4 border-t border-gray-100 bg-gray-50 px-6 py-5 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-gray-700">Pago</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Metodo: {pago?.metodoPago ?? "Sin registrar"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Estado: {pago?.estadoPago ?? "Sin registrar"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Monto: {formatoCOP.format(pago?.monto ?? pedido.total)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-gray-700">Entrega</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Estado: {entrega?.estadoEntrega ?? "Sin registrar"}
                    </p>
                    {pedido.tipoEntrega === "Retiro_tienda" ? (
                      <p className="mt-1 text-sm text-gray-600">
                        Hora de retiro:{" "}
                        {entrega?.fechaHoraRetiro
                          ? new Date(entrega.fechaHoraRetiro).toLocaleString()
                          : "Pendiente"}
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-sm text-gray-600">
                          Recibe: {entrega?.nombreRecibe ?? "Sin registrar"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Direccion: {entrega?.direccionEntrega ?? "Sin registrar"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Ciudad: {entrega?.ciudad ?? "Sin registrar"}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-gray-700">Resumen</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Subtotal: {formatoCOP.format(pedido.subtotal)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Costo de envio: {formatoCOP.format(pedido.costoEnvio)}
                    </p>
                    <p className="mt-3 text-lg font-bold text-gray-900">
                      Total: {formatoCOP.format(pedido.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
