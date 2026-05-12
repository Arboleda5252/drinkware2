"use client";

import * as React from "react";

type HorarioItem = {
  idHorario?: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};

type HorarioApiItem = {
  idHorario: number;
  idDomiciliario: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};

type HorarioDomiciliarioProps = {
  domiciliario: {
    idDomiciliario: number;
    nombreCompleto: string;
    disponibilidadManual: string;
  };
  onClose: () => void;
};

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

const createEmptyHorario = (): HorarioItem => ({
  diaSemana: "Lunes",
  horaInicio: "08:00",
  horaFin: "18:00",
  activo: true,
});

function toInputTime(value: string) {
  return value.slice(0, 5);
}

function toHorarioItem(item: HorarioApiItem): HorarioItem {
  return {
    idHorario: item.idHorario,
    diaSemana: item.diaSemana,
    horaInicio: toInputTime(item.horaInicio),
    horaFin: toInputTime(item.horaFin),
    activo: item.activo,
  };
}

export default function HorarioDomiciliario({
  domiciliario,
  onClose,
}: HorarioDomiciliarioProps) {
  const [horarios, setHorarios] = React.useState<HorarioItem[]>([]);
  const [deletedIds, setDeletedIds] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadHorarios = async () => {
      try {
        setLoading(true);
        setError(null);
        setDeletedIds([]);

        const res = await fetch("/api/horario_domiciliario", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }

        const horariosDomiciliario = (json.data as HorarioApiItem[])
          .filter((item) => item.idDomiciliario === domiciliario.idDomiciliario)
          .map(toHorarioItem);

        if (!cancelled) {
          setHorarios(horariosDomiciliario);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Error al cargar horarios");
          setHorarios([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHorarios();

    return () => {
      cancelled = true;
    };
  }, [domiciliario.idDomiciliario]);

  const updateHorario = (index: number, field: keyof HorarioItem, value: string | boolean) => {
    setHorarios((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const addHorario = () => {
    setHorarios((prev) => [...prev, createEmptyHorario()]);
  };

  const removeHorario = (index: number) => {
    setHorarios((prev) => {
      const item = prev[index];
      if (item?.idHorario) {
        setDeletedIds((current) => [...current, item.idHorario!]);
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      for (const horario of horarios) {
        if (!horario.diaSemana.trim()) {
          throw new Error("Cada bloque debe tener un dia de la semana");
        }

        if (!horario.horaInicio || !horario.horaFin) {
          throw new Error("Cada bloque debe tener hora de inicio y hora de fin");
        }

        if (horario.horaInicio >= horario.horaFin) {
          throw new Error("La hora de inicio debe ser menor que la hora de fin");
        }
      }

      const deleteRequests = deletedIds.map(async (idHorario) => {
        const res = await fetch(`/api/horario_domiciliario/${idHorario}`, {
          method: "DELETE",
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }
      });

      const saveRequests = horarios.map(async (horario) => {
        const payload = {
          idDomiciliario: domiciliario.idDomiciliario,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          activo: horario.activo,
        };

        if (horario.idHorario) {
          const res = await fetch(`/api/horario_domiciliario/${horario.idHorario}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();

          if (!res.ok || !json?.ok) {
            throw new Error(json?.error ?? `HTTP ${res.status}`);
          }

          return;
        }

        const res = await fetch("/api/horario_domiciliario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }
      });

      await Promise.all([...deleteRequests, ...saveRequests]);
      onClose();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Error al guardar horarios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-white/45 transition hover:text-white"
        >
          X
        </button>

        <div className="border-b border-white/10 px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Configuracion de horarios
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight">
            {domiciliario.nombreCompleto}
          </h2>
          <p className="mt-3 text-center text-sm text-white/65">
            Disponibilidad actual: {domiciliario.disponibilidadManual || "No definida"}
          </p>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
          {loading ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Cargando horarios desde la base de datos...
            </div>
          ) : horarios.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Este domiciliario no tiene horarios registrados.
            </div>
          ) : null}

          {horarios.map((horario, index) => (
            <div
              key={horario.idHorario ?? `nuevo-${index}`}
              className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 md:grid-cols-[1.3fr_1fr_1fr_auto]"
            >
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                  Dia
                </span>
                <select
                  value={horario.diaSemana}
                  onChange={(event) => updateHorario(index, "diaSemana", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/25"
                >
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                  Hora inicio
                </span>
                <input
                  type="time"
                  value={horario.horaInicio}
                  onChange={(event) => updateHorario(index, "horaInicio", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/25"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                  Hora fin
                </span>
                <input
                  type="time"
                  value={horario.horaFin}
                  onChange={(event) => updateHorario(index, "horaFin", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/25"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeHorario(index)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-500/80 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-400"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addHorario}
              disabled={saving}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-cyan-200/70 bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Agregar bloque horario
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar y cerrar"}
            </button>
          </div>

          {error && (
            <div className="rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
