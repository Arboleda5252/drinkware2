"use client";

type DomicilioItem = {
  idPedido: number;
  fechaCreacion: string;
  estadoPedido: string | null;
  entrega: {
    estadoEntrega: string | null;
  } | null;
  domiciliarioNombre: string | null;
};

type AsignarDomicilioProps<TPedido extends DomicilioItem> = {
  domicilios: TPedido[];
  formatDate: (value: string | null) => string;
  onViewDetail: (pedido: TPedido) => void;
};

export default function AsignarDomicilio<TPedido extends DomicilioItem>({
  domicilios,
  formatDate,
  onViewDetail,
}: AsignarDomicilioProps<TPedido>) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
      <div className="overflow-y-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="sticky top-0 bg-slate-950 text-center text-white/65">
            <tr>
              <th className="px-4 py-3 font-semibold">Orden</th>
              <th className="px-4 py-3 font-semibold">Fecha de Solicitud</th>
              <th className="px-4 py-3 font-semibold">Responsable de Entrega</th>
              <th className="px-4 py-3 font-semibold">Estado del Pedido</th>
              <th className="px-4 py-3 font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white/85">
            {domicilios.map((pedido) => {
              const entrega = pedido.entrega;
              const estadoEntrega = entrega?.estadoEntrega ?? "Pendiente";

              return (
                <tr key={pedido.idPedido} className="text-center transition hover:bg-white/6">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">Pedido #{pedido.idPedido}</p>
                  </td>
                  <td className="px-4 py-4 text-white/70">{formatDate(pedido.fechaCreacion)}</td>
                  <td className="px-4 py-4 text-white/70">{pedido.domiciliarioNombre ?? "Sin asignar"}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                      {estadoEntrega}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onViewDetail(pedido)}
                      className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/70 bg-cyan-500 px-5 py-3 text-xs font-bold text-white transition hover:scale-[1.02] hover:bg-cyan-400"
                    >
                      Asignar pedido
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
