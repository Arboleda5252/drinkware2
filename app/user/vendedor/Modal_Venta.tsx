import type { CartItem, FeedbackState } from "./types";

type DetalleItem = CartItem & {
  name: string;
  price: number;
  subtotal: number;
};

type OrderSummaryProps = {
  detalleItems: DetalleItem[];
  cartItems: CartItem[];
  deliveryType: "Domicilio" | "Retiro_tienda";
  paymentType: string;
  pickupDateTime: string;
  pickupMinDateTime: string;
  totalAmount: number;
  registering: boolean;
  vendedorError: string;
  feedback: FeedbackState | null;
  onRemoveCartItem: (productId: string) => void;
  onDeliveryTypeChange: (value: "Domicilio" | "Retiro_tienda") => void;
  onPaymentTypeChange: (value: string) => void;
  onPickupDateTimeChange: (value: string) => void;
  onRegisterSale: () => void;
};

export function OrderSummary({
  detalleItems,
  cartItems,
  deliveryType,
  paymentType,
  pickupDateTime,
  pickupMinDateTime,
  totalAmount,
  registering,
  vendedorError,
  feedback,
  onRemoveCartItem,
  onDeliveryTypeChange,
  onPaymentTypeChange,
  onPickupDateTimeChange,
  onRegisterSale,
}: OrderSummaryProps) {
  return (
    <div className="rounded-xl border border-slate-100 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Productos seleccionados</h2>
      </div>

      {cartItems.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Aun no has agregado productos.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="text-xs uppercase text-slate-400">
                <th className="py-2">Producto</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2">Precio unidad</th>
                <th className="py-2">Subtotal</th>
                <th className="py-2 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {detalleItems.map((item) => (
                <tr key={item.productId} className="border-t text-sm">
                  <td className="py-3 font-medium text-slate-700">{item.name}</td>
                  <td className="py-3">{item.quantity}</td>
                  <td className="py-3">${item.price.toLocaleString("es-CO")}</td>
                  <td className="py-3 font-semibold text-slate-900">
                    ${item.subtotal.toLocaleString("es-CO")}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveCartItem(item.productId)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-400">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="mt-1 text-base font-semibold text-slate-800">
                    Despacho del pedido
                  </h3>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="group cursor-pointer rounded-2xl border border-sky-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-100/70">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="tipoEntregaPreview"
                      checked={deliveryType === "Domicilio"}
                      onChange={() => onDeliveryTypeChange("Domicilio")}
                      className="mt-1 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <p className="font-semibold text-sky-900">Domicilio</p>
                    </div>
                  </div>
                </label>

                <label className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/60">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="tipoEntregaPreview"
                      checked={deliveryType === "Retiro_tienda"}
                      onChange={() => onDeliveryTypeChange("Retiro_tienda")}
                      className="mt-1 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">Retiro en tienda</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {deliveryType === "Domicilio" ? (
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  Domiciliario
                  <select
                    defaultValue=""
                    className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="" disabled>
                      Selecciona un domiciliario
                    </option>
                    <option value="dom-1">Domiciliario 1</option>
                    <option value="dom-2">Domiciliario 2</option>
                  </select>
                </label>
              ) : (
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  Fecha y hora de retiro
                  <input
                    type="datetime-local"
                    value={pickupDateTime}
                    min={pickupMinDateTime}
                    onChange={(event) => onPickupDateTimeChange(event.target.value)}
                    className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              )}

              <label className="flex flex-col text-sm font-medium text-slate-600">
                Tipo de pago
                <select
                  value={paymentType}
                  onChange={(event) => onPaymentTypeChange(event.target.value)}
                  className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="" disabled>
                    Selecciona un tipo de pago
                  </option>
                  <option value="efectivo">Efectivo</option>
                  <option value="contraentrega">Contraentrega</option>
                  <option value="pago_online">Pago Online</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Confirmacion de compra
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Subtotal productos</span>
                  <span className="font-semibold text-slate-800">
                    ${totalAmount.toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-4 py-3 text-slate-400">
                  <span>Costo envio</span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div>
                <p className="font-semibold text-slate-700">Total</p>
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  ${totalAmount.toLocaleString("es-CO")}
                </p>
              </div>
              <button
                type="button"
                onClick={onRegisterSale}
                disabled={registering}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {registering ? "Registrando..." : "Registrar venta"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {vendedorError && <p className="mt-3 text-sm text-rose-600">{vendedorError}</p>}

      {feedback && (
        <p
          className={`mt-3 rounded-lg border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
