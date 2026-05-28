'use client';

type FilterValues = {
  category: string;
  priceRange: string;
  salesLevel: string;
  marginLevel: string;
};

type Option = {
  value: string;
  label: string;
};

type Props = {
  filters: FilterValues;
  categories: Option[];
  priceRanges: Option[];
  salesLevels: Option[];
  marginLevels: Option[];
  onChange: (field: keyof FilterValues, value: string) => void;
  onReset: () => void;
};

export default function FilterDropdown({
  filters,
  categories,
  priceRanges,
  salesLevels,
  marginLevels,
  onChange,
  onReset,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.8fr_1.2fr_1.2fr_1.2fr]">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Categoría</label>
        <select
          value={filters.category}
          onChange={(e) => onChange("category", e.target.value)}
          className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/85 px-4 py-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Rango de precio</label>
        <select
          value={filters.priceRange}
          onChange={(e) => onChange("priceRange", e.target.value)}
          className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/85 px-4 py-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {priceRanges.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Nivel de ventas</label>
        <select
          value={filters.salesLevel}
          onChange={(e) => onChange("salesLevel", e.target.value)}
          className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/85 px-4 py-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {salesLevels.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Margen</label>
          <select
            value={filters.marginLevel}
            onChange={(e) => onChange("marginLevel", e.target.value)}
            className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/85 px-4 py-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {marginLevels.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-950/85 px-5 text-sm font-semibold text-slate-200 transition hover:border-sky-500 hover:bg-slate-900"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
