type PageHeaderProps = {
  onOpenInventory: () => void;
};

export function PageHeader({ onOpenInventory }: PageHeaderProps) {
  return (
    <header className="space-y-4 border-b pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Registrar nueva venta</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onOpenInventory}
            className="inline-flex items-center justify-center rounded-full border border-blue-700 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Ver inventario
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Completa los datos del cliente y confirma el pedido.
      </p>
    </header>
  );
}
