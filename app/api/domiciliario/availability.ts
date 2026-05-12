import { sql } from "@/app/Datalibs/database";

type DomiciliarioAvailabilityShape = {
  idDomiciliario: number;
  estadoLaboral: string;
  disponibilidadManual: string;
};

type HorarioDisponibleRow = {
  idDomiciliario: number;
};

const TIME_ZONE = "America/Bogota";
const ESTADOS_DESCONECTADOS = new Set(["inactivo", "suspendido"]);
const DISPONIBILIDAD_DESCONECTADO = "Desconectado";
const DISPONIBILIDAD_DISPONIBLE = "Disponible";
const DISPONIBILIDAD_OCUPADO = "Ocupado";

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCurrentBogotaDay() {
  const day = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    timeZone: TIME_ZONE,
  }).format(new Date());

  return capitalize(normalizeComparableText(day));
}

function getCurrentBogotaTime() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).format(new Date());
}

export async function applyComputedDisponibilidad<
  T extends DomiciliarioAvailabilityShape,
>(rows: T[]): Promise<T[]> {
  if (!rows.length) {
    return rows;
  }

  const diaSemanaActual = getCurrentBogotaDay();
  const horaActual = getCurrentBogotaTime();
  const ids = rows.map((row) => Number(row.idDomiciliario));

  const { rows: horariosDisponibles } = await sql<HorarioDisponibleRow>(
    `
      SELECT DISTINCT id_domiciliario AS "idDomiciliario"
      FROM public.horario_domiciliario
      WHERE activo = true
        AND id_domiciliario = ANY($1::integer[])
        AND dia_semana = $2
        AND hora_inicio <= $3::time
        AND hora_fin >= $3::time;
    `,
    [ids, diaSemanaActual, horaActual]
  );

  const disponiblesAhora = new Set(
    horariosDisponibles.map((horario) => Number(horario.idDomiciliario))
  );

  const computedRows = rows.map((row) => {
    const estadoLaboral = normalizeComparableText(row.estadoLaboral);
    const disponibilidadManual =
      ESTADOS_DESCONECTADOS.has(estadoLaboral) || !disponiblesAhora.has(Number(row.idDomiciliario))
        ? DISPONIBILIDAD_DESCONECTADO
        : DISPONIBILIDAD_DISPONIBLE;

    return {
      ...row,
      disponibilidadManual,
    };
  });

  const rowsToSync = computedRows.filter((row, index) => {
    const currentValue = rows[index]?.disponibilidadManual;
    return (
      currentValue === DISPONIBILIDAD_DESCONECTADO ||
      currentValue === DISPONIBILIDAD_DISPONIBLE ||
      currentValue === DISPONIBILIDAD_OCUPADO
    )
      ? currentValue !== row.disponibilidadManual
      : true;
  });

  if (rowsToSync.length > 0) {
    await Promise.all(
      rowsToSync.map((row) =>
        sql(
          `
            UPDATE public.domiciliario
            SET disponibilidad_manual = $1::varchar(20)
            WHERE id_domiciliario = $2::integer;
          `,
          [row.disponibilidadManual, row.idDomiciliario]
        )
      )
    );
  }

  return computedRows;
}
