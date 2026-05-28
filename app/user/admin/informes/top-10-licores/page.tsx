import Link from "next/link";
import Top10LicoresClient from "./Top10LicoresClient";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function normalizeMonth(value?: string) {
  const month = Number(value);
  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    return month;
  }
  return new Date().getMonth() + 1;
}

function normalizeYear(value?: string) {
  const year = Number(value);
  if (Number.isInteger(year) && year >= 2020 && year <= new Date().getFullYear()) {
    return year;
  }
  return new Date().getFullYear();
}

export default async function Top10LicoresPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const selectedMonth = normalizeMonth(searchParams.month);
  const selectedYear = normalizeYear(searchParams.year);
  const label = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <main className="min-h-screen bg-slate-950/20 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-4xl border border-sky-400/20 bg-slate-900/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300/80">
                Top 10 licores
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Los 10 licores más vendidos por mes
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Analiza las botellas más rotadas en el mes seleccionado y compara su desempeño por ingresos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-3xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-200">
                Mes seleccionado: <span className="font-semibold text-white">{label}</span>
              </div>
              <Link
                href="/user/admin/informes"
                className="inline-flex items-center rounded-full border border-slate-700/70 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Volver a informes
              </Link>
            </div>
          </div>

          <Top10LicoresClient initialMonth={selectedMonth} year={selectedYear} />
        </section>
      </div>
    </main>
  );
}
