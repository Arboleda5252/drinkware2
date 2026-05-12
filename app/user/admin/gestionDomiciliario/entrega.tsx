"use client";

type PagoItem = {
  idPago: number;
  metodoPago: string;
  estadoPago: string;
  monto: number;
  fechaPago: string | null;
  referenciaPago: string | null;
  observacion: string | null;
};

type DetalleProductoItem = {
  detalle: {
    idDetallePedido: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number | null;
    idProducto: number;
  };
  producto: {
    nombre: string;
    categoria: string | null;
  } | null;
};

type EntregaModalPedido = {
  idPedido: number;
  fechaCreacion: string;
  estadoPedido: string | null;
  tipoEntrega: string | null;
  total: number;
  entrega: {
    idDomiciliario: number | null;
    estadoEntrega: string | null;
    direccionEntrega: string | null;
    ciudad: string | null;
    telefonoContacto: string | null;
    nombreRecibe: string | null;
    costoEnvio: number;
    fechaProgramada: string | null;
    fechaAsignacion: string | null;
    fechaSalida: string | null;
    fechaEntrega: string | null;
    fechaHoraRetiro: string | null;
    observacion: string | null;
  } | null;
  domiciliarioNombre: string | null;
  domiciliario: {
    correo: string | null;
    documento: string | null;
    estadoLaboral: string;
    disponibilidadManual: string;
  } | null;
  vendedorNombre: string;
  pagos: PagoItem[];
  detalles: DetalleProductoItem[];
};

type ActiveDomiciliario = {
  idDomiciliario: number;
  nombreCompleto: string;
};

type EntregaModalProps = {
  pedido: EntregaModalPedido;
  activeDomiciliarios: ActiveDomiciliario[];
  assigningPedidoId: number | null;
  formatDate: (value: string | null) => string;
  onAssignEntrega: (idDomiciliario: number) => void;
  onClose: () => void;
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntregaModal({
  pedido,
  activeDomiciliarios,
  assigningPedidoId,
  formatDate,
  onAssignEntrega,
  onClose,
}: EntregaModalProps) {
  const isAssigning = assigningPedidoId === pedido.idPedido;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-white/45 transition hover:text-white"
        >
          X
        </button>

        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_45%)] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Pedido #{pedido.idPedido}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <InfoCard
              label="Estado entrega"
              value={pedido.entrega?.estadoEntrega ?? "pendiente"}
            />
            <InfoCard label="Fecha solicitud" value={formatDate(pedido.fechaCreacion)} />
            <InfoCard label="Vendedor" value={pedido.vendedorNombre} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">Pedido</h3>
              <div className="mt-4 space-y-3">
                {pedido.detalles.length === 0 ? (
                  <p className="text-sm text-white/60">Este pedido no tiene productos registrados.</p>
                ) : (
                  pedido.detalles.map(({ detalle, producto }) => {
                    const subtotal =
                      detalle.subtotal ?? detalle.cantidad * detalle.precioUnitario;

                    return (
                      <div
                        key={detalle.idDetallePedido}
                        className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {producto?.nombre ?? `Producto #${detalle.idProducto}`}
                            </p>
                            <p className="mt-1 text-sm text-white/60">
                              Cantidad: {detalle.cantidad} | Precio unidad:{" "}
                              {formatoCOP.format(detalle.precioUnitario)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-amber-300/30 bg-[linear-gradient(180deg,rgba(251,191,36,0.18),rgba(251,191,36,0.06))] p-5 shadow-[0_18px_40px_rgba(245,158,11,0.18)]">
                <h3 className="text-lg font-semibold text-white">Domiciliario</h3>
                <div className="mt-5 rounded-[1.4rem] border border-amber-200/30 bg-slate-950/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                        Asignar domiciliario
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">
                        {pedido.domiciliarioNombre ?? "Sin asignar"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <select
                      value={pedido.entrega?.idDomiciliario ?? ""}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isInteger(value) && value > 0) {
                          onAssignEntrega(value);
                        }
                      }}
                      disabled={
                        isAssigning || activeDomiciliarios.length === 0
                      }
                      className="mt-2 w-full rounded-2xl border border-amber-200/35 bg-slate-950/85 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Selecciona un domiciliario</option>
                      {activeDomiciliarios.map((domiciliario) => (
                        <option
                          key={domiciliario.idDomiciliario}
                          value={domiciliario.idDomiciliario}
                        >
                          {domiciliario.nombreCompleto}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <HighlightStat
                      label="Disponibilidad"
                      value={pedido.domiciliario?.disponibilidadManual ?? "-"}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">Entrega</h3>
                <div className="mt-4 grid gap-4 text-sm text-white/70 sm:grid-cols-2">
                  <InfoRow label="Recibe" value={pedido.entrega?.nombreRecibe ?? "-"} />
                  <InfoRow label="Contacto" value={pedido.entrega?.telefonoContacto ?? "-"} />
                  <InfoRow label="Direccion" value={pedido.entrega?.direccionEntrega ?? "-"} />
                  <InfoRow label="Ciudad" value={pedido.entrega?.ciudad ?? "-"} />
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">Pago</h3>
                <div className="mt-4 space-y-3">
                  {pedido.pagos.length === 0 ? (
                    <p className="text-sm text-white/60">Sin pagos registrados.</p>
                  ) : (
                    pedido.pagos.map((pago) => (
                      <div
                        key={pago.idPago}
                        className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4 text-sm text-white/70"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <InfoRow label="Estado" value={pago.estadoPago} />
                          <InfoRow
                            label="Monto"
                            value={formatoCOP.format(Number(pago.monto ?? 0))}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
};

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <span className="block text-xs uppercase tracking-[0.18em] text-sky-200/80">{label}</span>
      <p className="mt-1 text-sm text-white/80">{value}</p>
    </div>
  );
}

type StatusPillProps = {
  label: string;
  value: string;
};

function StatusPill({ label, value }: StatusPillProps) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
      <span className="text-white/45">{label}: </span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

type HighlightStatProps = {
  label: string;
  value: string;
};

function HighlightStat({ label, value }: HighlightStatProps) {
  return (
    <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/75">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
