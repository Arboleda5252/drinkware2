import type { RefObject } from "react";

import type { InventorioProducto } from "./types";

type ProductSelectorProps = {
  productSearchRef: RefObject<HTMLDivElement | null>;
  productInputRef: RefObject<HTMLInputElement | null>;
  productSearchTerm: string;
  selectedProductId: string;
  selectedProductLabel: string;
  inventoryLoading: boolean;
  inventoryError: string;
  stockError: string;
  quantity: number | null;
  inventorioProductos: InventorioProducto[];
  productSearchResults: InventorioProducto[];
  productSearchHasMore: boolean;
  showProductSuggestions: boolean;
  seleccionarProducto: InventorioProducto | undefined;
  seleccionarProductoCart: number;
  onProductSearchTermChange: (value: string) => void;
  onShowProductSuggestionsChange: (show: boolean) => void;
  onSelectedProductIdChange: (value: string) => void;
  onHandleProductSelection: (product: InventorioProducto) => void;
  onClearProductSelection: () => void;
  onQuantityChange: (quantity: number | null) => void;
  onAddProduct: () => void;
};

export function ProductSelector({
  productSearchRef,
  productInputRef,
  productSearchTerm,
  selectedProductId,
  selectedProductLabel,
  inventoryLoading,
  inventoryError,
  stockError,
  quantity,
  inventorioProductos,
  productSearchResults,
  productSearchHasMore,
  showProductSuggestions,
  seleccionarProducto,
  seleccionarProductoCart,
  onProductSearchTermChange,
  onShowProductSuggestionsChange,
  onSelectedProductIdChange,
  onHandleProductSelection,
  onClearProductSelection,
  onQuantityChange,
  onAddProduct,
}: ProductSelectorProps) {
  return (
    <div className="rounded-xl border border-slate-100 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-700">Agregar productos</h2>
      <div className="space-y-4">
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Busca y selecciona un producto
          <div ref={productSearchRef} className="relative mt-1">
            <input
              type="text"
              ref={productInputRef}
              value={productSearchTerm}
              onChange={(event) => {
                onProductSearchTermChange(event.target.value);
                onShowProductSuggestionsChange(true);
                if (selectedProductId) {
                  onSelectedProductIdChange("");
                }
              }}
              onFocus={() => {
                if (!inventoryLoading && inventorioProductos.length > 0) {
                  onShowProductSuggestionsChange(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && productSearchResults.length > 0) {
                  event.preventDefault();
                  onHandleProductSelection(productSearchResults[0]);
                }
                if (event.key === "Escape") {
                  onShowProductSuggestionsChange(false);
                }
              }}
              placeholder={
                inventoryLoading
                  ? "Cargando inventario..."
                  : inventorioProductos.length === 0
                    ? "Sin productos disponibles"
                    : ""
              }
              disabled={inventoryLoading || inventorioProductos.length === 0}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-base text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

            {!productSearchTerm && (
              <span className="pointer-events-none absolute inset-y-0 left-3 right-10 flex items-center truncate text-sm text-slate-500">
                {selectedProductId && selectedProductLabel ? selectedProductLabel : "Buscar"}
              </span>
            )}

            {(productSearchTerm || selectedProductId) && (
              <button
                type="button"
                aria-label="Limpiar seleccion o busqueda"
                onClick={() => {
                  onClearProductSelection();
                  if (!inventoryLoading && inventorioProductos.length > 0) {
                    onShowProductSuggestionsChange(true);
                  }
                  productInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                x
              </button>
            )}

            {showProductSuggestions && inventorioProductos.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {inventoryLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-500">Cargando inventario...</p>
                ) : productSearchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    No se encontraron productos para esa busqueda.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {productSearchResults.map((product) => {
                      const isActive = product.id === selectedProductId;
                      return (
                        <li key={product.id ?? product.name}>
                          <button
                            type="button"
                            onClick={() => onHandleProductSelection(product)}
                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${isActive ? "bg-slate-50" : "hover:bg-slate-50"}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">
                                {product.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                Disponible: {product.stock ?? 0} -{" "}
                                {product.description?.trim() || "Sin descripcion"}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {"$" + (product.price ?? 0).toLocaleString("es-CO")}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {productSearchHasMore && (
                      <li className="px-4 py-2 text-center text-[11px] uppercase tracking-wide text-slate-400">
                        Resultados limitados
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          {inventoryError && inventorioProductos.length === 0 ? (
            <span className="mt-1 text-xs text-rose-600">{inventoryError}</span>
          ) : inventorioProductos.length > 0 ? (
            <span className="mt-1 text-xs text-slate-500">
              Seguir escribiendo para cambiar el producto seleccionado.
            </span>
          ) : null}
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-600">
          Cantidad
          <input
            type="number"
            min={0}
            value={quantity ?? ""}
            onChange={(event) => {
              const rawValue = event.target.value;
              if (rawValue === "") {
                onQuantityChange(null);
                return;
              }
              const parsed = parseInt(rawValue, 10);
              onQuantityChange(Number.isNaN(parsed) ? null : Math.max(parsed, 0));
            }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none"
          />
          {seleccionarProducto && (
            <span className={`mt-1 text-xs ${stockError ? "text-rose-600" : "text-slate-500"}`}>
              {stockError
                ? stockError
                : `Disponible: ${(seleccionarProducto.stock ?? 0) - seleccionarProductoCart} unidad(es) libres.`}
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={onAddProduct}
          disabled={!selectedProductId || !!stockError || inventorioProductos.length === 0}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Anadir al pedido
        </button>
      </div>
    </div>
  );
}
