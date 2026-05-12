"use client";

import React from "react";

// --- Tipos (Sin cambios en la lógica) ---
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      {/* Contenedor Principal: Eliminamos bordes pesados y usamos sombras profundas */}
      <div className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-[2.5rem] bg-slate-950 text-slate-200 shadow-2xl ring-1 ring-white/10">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10 hover:scale-110"
        >
          ✕
        </button>

        <div className="relative overflow-hidden px-8 pt-10 pb-6">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />
          <div className="relative">
            <span className="text-sm font-medium tracking-widest text-blue-400 uppercase">Gestión de Entrega</span>
            <h2 className="text-4xl font-black tracking-tight text-white mt-1">
              Pedido #{pedido.idPedido}
            </h2>
          </div>
        </div>

        <div className="px-8 pb-10">
          <div className="grid gap-8 lg:grid-cols-12">
            
            <div className="lg:col-span-7 space-y-8">
              
              <div className="grid grid-cols-3 gap-4 py-4">
                <QuickStat label="Estado" value={pedido.entrega?.estadoEntrega ?? "Pendiente"} />
                <QuickStat label="Fecha" value={formatDate(pedido.fechaCreacion)} />
                <QuickStat label="Vendedor" value={pedido.vendedorNombre} />
              </div>

              <section>
                <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                   Detalle del Pedido
                </h3>
                <div className="space-y-2">
                  {pedido.detalles.map(({ detalle, producto }) => (
                    <div 
                      key={detalle.idDetallePedido}
                      className="group flex items-center justify-between rounded-2xl bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                    >
                      <div>
                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {producto?.nombre ?? `Producto #${detalle.idProducto}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          Cantidad: {detalle.cantidad}  |  {formatoCOP.format(detalle.precioUnitario)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {formatoCOP.format(detalle.cantidad * detalle.precioUnitario)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <section className="space-y-3">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Entrega</h3>
                   <div className="text-sm space-y-1">
                      <p><span className="text-slate-500">Recibe:</span> {pedido.entrega?.nombreRecibe || "-"}</p>
                      <p><span className="text-slate-500">Dirección:</span> {pedido.entrega?.direccionEntrega || "-"}</p>
                      <p><span className="text-slate-500">Ciudad:</span> {pedido.entrega?.ciudad || "-"}</p>
                   </div>
                </section>
                <section className="space-y-3">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Pago</h3>
                   {pedido.pagos.map(pago => (
                     <div key={pago.idPago} className="bg-white/5 rounded-xl p-3 inline-block">
                        <p className="text-lg font-bold">{formatoCOP.format(pago.monto)}</p>
                        <p className="text-xs uppercase font-semibold text-slate-400">{pago.estadoPago}</p>
                     </div>
                   ))}
                </section>
              </div>
            </div>

            <div className="lg:col-span-5">
              <section className="sticky top-0 rounded-[2rem] bg-gradient-to-b from-amber-500/20 to-transparent p-[1px] shadow-2xl shadow-amber-500/10">
                <div className="rounded-[2rem] bg-slate-900/90 p-8 backdrop-blur-xl">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Domiciliario</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <label className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/80">
                        Asignación Actual
                      </label>
                      <p className="mt-1 text-1xl font-black text-white">
                        {pedido.domiciliarioNombre ?? "Sin asignar"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Seleccionar nuevo responsable</label>
                      <select
                        value={pedido.entrega?.idDomiciliario ?? ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > 0) onAssignEntrega(val);
                        }}
                        disabled={isAssigning || activeDomiciliarios.length === 0}
                        className="w-full appearance-none rounded-2xl border-none bg-white/10 px-5 py-4 text-white outline-none ring-1 ring-white/20 transition focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                      >
                        <option value="" className="bg-slate-900">Selecciona un domiciliario...</option>
                        {activeDomiciliarios.map((d) => (
                          <option key={d.idDomiciliario} value={d.idDomiciliario} className="bg-slate-900">
                            {d.nombreCompleto}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Badge de Disponibilidad */}
                    <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
                      <span className="text-sm font-semibold text-amber-200/80 text-center">Disponibilidad</span>
                      <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950">
                        {pedido.domiciliario?.disponibilidadManual ?? " "}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Componentes Auxiliares (Simplificados) ---

function QuickStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col border-l border-white/10 pl-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}