type CustomerFormProps = {
  customerHasDocument: boolean;
  customerDocument: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  documentLookupLoading: boolean;
  documentLookupError: string;
  documentLookupMessage: string;
  onDocumentModeChange: (hasDocument: boolean) => void;
  onCustomerDocumentChange: (value: string) => void;
  onDocumentBlur: () => void;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onCustomerCityChange: (value: string) => void;
  onCustomerAddressChange: (value: string) => void;
};

export function CustomerForm({
  customerHasDocument,
  customerDocument,
  customerName,
  customerPhone,
  customerCity,
  customerAddress,
  documentLookupLoading,
  documentLookupError,
  documentLookupMessage,
  onDocumentModeChange,
  onCustomerDocumentChange,
  onDocumentBlur,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerCityChange,
  onCustomerAddressChange,
}: CustomerFormProps) {
  return (
    <div className="rounded-xl border border-slate-100 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-700">Datos del cliente</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
            <input
              type="radio"
              name="document-mode"
              className="h-4 w-4 accent-emerald-600"
              checked={customerHasDocument}
              onChange={() => onDocumentModeChange(true)}
            />
            Con documento
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
            <input
              type="radio"
              name="document-mode"
              className="h-4 w-4 accent-emerald-600"
              checked={!customerHasDocument}
              onChange={() => onDocumentModeChange(false)}
            />
            Venta rapida
          </label>
        </div>

        <label className="flex flex-col text-sm font-medium text-slate-600">
          Documento
          <input
            type="text"
            value={customerDocument}
            onChange={(event) => onCustomerDocumentChange(event.target.value)}
            onBlur={onDocumentBlur}
            placeholder={customerHasDocument ? "Documento" : "Documento no requerido"}
            disabled={!customerHasDocument}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          {customerHasDocument ? (
            <>
              {documentLookupLoading && (
                <span className="mt-1 text-xs text-slate-500">Buscando documento...</span>
              )}
              {documentLookupError && (
                <span className="mt-1 text-xs text-rose-600">{documentLookupError}</span>
              )}
              {!documentLookupError && documentLookupMessage && (
                <span className="mt-1 text-xs text-emerald-600">{documentLookupMessage}</span>
              )}
            </>
          ) : (
            <span className="mt-1 text-xs text-slate-500">Registraremos esta venta</span>
          )}
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-600">
          Nombre completo
          <input
            type="text"
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            placeholder="Nombre"
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-600">
          Telefono
          <input
            type="tel"
            value={customerPhone}
            onChange={(event) => onCustomerPhoneChange(event.target.value)}
            placeholder="#######"
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-600">
          Ciudad
          <input
            type="text"
            value={customerCity}
            onChange={(event) => onCustomerCityChange(event.target.value)}
            placeholder="Ciudad"
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-600">
          Direccion
          <textarea
            value={customerAddress}
            onChange={(event) => onCustomerAddressChange(event.target.value)}
            placeholder="Direccion"
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none"
          />
        </label>
      </div>
    </div>
  );
}
