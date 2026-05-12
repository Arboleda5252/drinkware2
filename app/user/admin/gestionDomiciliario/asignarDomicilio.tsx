"use client";

type ActiveDomiciliario = {
  idDomiciliario: number;
  nombreCompleto: string;
};

type DomicilioEntrega = {
  idDomiciliario: number | null;
  estadoEntrega: string | null;
};

type DomicilioItem = {
  idPedido: number;
  fechaCreacion: string;
  estadoPedido: string | null;
  entrega: DomicilioEntrega | null;
  domiciliarioNombre: string | null;
};

type AsignarDomicilioProps<TPedido extends DomicilioItem> = {
  domicilios: TPedido[];
  activeDomiciliarios: ActiveDomiciliario[];
  assigningPedidoId: number | null;
  formatDate: (value: string | null) => string;
  onAssignEntrega: (pedido: TPedido, idDomiciliario: number) => void;
  onViewDetail: (pedido: TPedido) => void;
};

export default function AsignarDomicilio<TPedido extends DomicilioItem>({
  domicilios,
  activeDomiciliarios,
  assigningPedidoId,
  formatDate,
  onAssignEntrega,
  onViewDetail,
}: AsignarDomicilioProps<TPedido>) {
  return (
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
                    <p className="mt-1 text-xs text-white/55">{pedido.estadoPedido ?? "Sin estado"}</p>
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
                          onAssignEntrega(pedido, value);
                        }
                      }}
                      disabled={
                        assigningPedidoId === pedido.idPedido || activeDomiciliarios.length === 0
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/25"
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
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onViewDetail(pedido)}
                      className="inline-flex rounded-2xl border border-cyan-200/70 bg-cyan-500 px-5 py-3 text-base font-bold text-white transition hover:scale-[1.02] hover:bg-cyan-400"
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
  );
}
