import type { InventorioProducto } from "./types";

type InventoryModalProps = {
  inventorySearch: string;
  inventoryLoading: boolean;
  inventoryError: string;
  inventorioProductos: InventorioProducto[];
  filtradoInventarioProducts: InventorioProducto[];
  onClose: () => void;
  onInventorySearchChange: (value: string) => void;
  onRetry: () => void;
};

export function InventoryModal({
  inventorySearch,
  inventoryLoading,
  inventoryError,
  inventorioProductos,
  filtradoInventarioProducts,
  onClose,
  onInventorySearchChange,
  onRetry,
}: InventoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8 text-slate-700">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Listado de productos</h3>
            <p className="text-sm text-slate-500">Consulta el stock actual</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar inventario"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            X
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="w-full text-left text-sm font-medium text-slate-600">
            <input
              type="text"
              value={inventorySearch}
              onChange={(event) => onInventorySearchChange(event.target.value)}
              placeholder="Buscar en el inventario"
              disabled={inventoryLoading || inventorioProductos.length === 0}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </label>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto text-center">
          {inventoryLoading ? (
            <p className="text-center text-sm text-slate-500">Cargando inventario...</p>
          ) : inventoryError ? (
            <div className="mx-auto max-w-md rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p>{inventoryError}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-xs font-semibold text-rose-700 underline"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : inventorioProductos.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No hay productos disponibles en el inventario.
            </p>
          ) : filtradoInventarioProducts.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No se encontraron productos para esa busqueda.
            </p>
          ) : (
            <div className="flex justify-center">
              <table className="w-full max-w-2xl table-auto text-center text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2">Nombre</th>
                    <th className="py-2">Descripcion</th>
                    <th className="py-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradoInventarioProducts.map((product) => (
                    <tr key={product.id ?? product.name} className="border-t border-slate-100">
                      <td className="py-3 font-semibold text-slate-800">{product.name}</td>
                      <td className="py-3 text-slate-500">
                        {product.description ?? "Sin descripcion"}
                      </td>
                      <td className="py-3 font-bold text-slate-900">{product.stock ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
