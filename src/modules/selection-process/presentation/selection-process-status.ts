import {
  getCataloniaCalendarDate,
  getCataloniaDayNumber,
} from "@/shared/utils/catalonia-calendar-date";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";

const MILLISECONDS_PER_DAY =
  86_400_000;

/*
 * ============================================================
 * ESTADO OFICIAL CIDO
 * ============================================================
 */

export type OfficialStatusTone =
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "gray";

export type OfficialStatusPresentation = {
  label: string;

  tone:
    OfficialStatusTone;

  badgeClassName:
    string;

  dotClassName:
    string;
};

/*
 * Devuelve cómo debe mostrarse
 * visualmente el estado oficial
 * de CIDO.
 *
 * Importante:
 *
 * El estado oficial NO es lo mismo
 * que el estado del plazo.
 *
 * Ejemplo:
 *
 * Estado oficial:
 *   "En curso"
 *
 * Plazo:
 *   "Finalizado"
 */
export function getOfficialStatusPresentation(
  status: string,
  statusId?: number,
): OfficialStatusPresentation {
  const normalized =
    normalizeStatus(
      status,
    );

  /*
   * Estados anulados,
   * suspendidos, cancelados...
   */
  if (
    includesAny(
      normalized,
      [
        "anul",
        "cancel",
        "susp",
        "desist",
        "revoc",
        "invalid",
      ],
    )
  ) {
    return {
      label:
        status,

      tone:
        "red",

      badgeClassName:
        "border border-[#F6D0CC] bg-[#FDECEC] text-[#B42318]",

      dotClassName:
        "bg-[#D92D20]",
    };
  }

  /*
   * Estados finalizados.
   */
  if (
    includesAny(
      normalized,
      [
        "final",
        "tanc",
        "cerr",
        "resolt",
        "resuelto",
        "acabat",
        "acabado",
        "concl",
      ],
    )
  ) {
    return {
      label:
        status,

      tone:
        "gray",

      badgeClassName:
        "border border-[#DDE1E8] bg-[#EFF1F4] text-[#626C7E]",

      dotClassName:
        "bg-[#8A92A2]",
    };
  }

  /*
   * Inscripción / presentación
   * actualmente abierta.
   */
  if (
    includesAny(
      normalized,
      [
        "obert",
        "abiert",
        "inscripcio oberta",
        "inscripcion abierta",
        "termini obert",
        "plazo abierto",
      ],
    )
  ) {
    return {
      label:
        status,

      tone:
        "green",

      badgeClassName:
        "border border-[#CDE8D8] bg-[#E6F4EC] text-[#1B7A4B]",

      dotClassName:
        "bg-[#23A26B]",
    };
  }

  /*
   * Convocatoria pendiente,
   * próxima o todavía no iniciada.
   */
  if (
    includesAny(
      normalized,
      [
        "pendent",
        "pendiente",
        "proxim",
        "proper",
        "no iniciat",
        "no iniciado",
      ],
    )
  ) {
    return {
      label:
        status,

      tone:
        "blue",

      badgeClassName:
        "border border-[#DDE1FA] bg-[#EEF0FC] text-[#3B45B5]",

      dotClassName:
        "bg-[#4F5BD5]",
    };
  }

  /*
   * Proceso ya iniciado.
   */
  if (
    includesAny(
      normalized,
      [
        "curs",
        "tramit",
        "proces",
        "provisional",
        "admes",
        "admit",
      ],
    )
  ) {
    return {
      label:
        status,

      tone:
        "amber",

      badgeClassName:
        "border border-[#F7DFAC] bg-[#FFF4DB] text-[#9A6700]",

      dotClassName:
        "bg-[#E9A100]",
    };
  }

  /*
   * Fallback por ID.
   *
   * Los estados activos que estamos
   * sincronizando actualmente son:
   *
   * 1
   * 2
   * 3
   *
   * Usamos el ID únicamente si el
   * texto no ha permitido identificar
   * claramente el estado.
   */
  if (
    statusId === 1
  ) {
    return {
      label:
        status,

      tone:
        "green",

      badgeClassName:
        "border border-[#CDE8D8] bg-[#E6F4EC] text-[#1B7A4B]",

      dotClassName:
        "bg-[#23A26B]",
    };
  }

  if (
    statusId === 2
  ) {
    return {
      label:
        status,

      tone:
        "blue",

      badgeClassName:
        "border border-[#DDE1FA] bg-[#EEF0FC] text-[#3B45B5]",

      dotClassName:
        "bg-[#4F5BD5]",
    };
  }

  if (
    statusId === 3
  ) {
    return {
      label:
        status,

      tone:
        "amber",

      badgeClassName:
        "border border-[#F7DFAC] bg-[#FFF4DB] text-[#9A6700]",

      dotClassName:
        "bg-[#E9A100]",
    };
  }

  /*
   * Estado desconocido.
   */
  return {
    label:
      status,

    tone:
      "gray",

    badgeClassName:
      "border border-[#DDE1E8] bg-[#EFF1F4] text-[#626C7E]",

    dotClassName:
      "bg-[#8A92A2]",
  };
}

/*
 * ============================================================
 * ESTADO DEL PLAZO
 * ============================================================
 */

export type ApplicationPeriodState =
  | "open"
  | "future"
  | "closed"
  | "unknown";

export type ApplicationPeriodPresentation = {
  state:
    ApplicationPeriodState;

  /*
   * Texto corto para badge.
   *
   * Ejemplo:
   *
   * Plazo abierto
   */
  label:
    string;

  /*
   * Información adicional.
   *
   * Ejemplo:
   *
   * Quedan 12 días
   */
  detail:
    string;

  /*
   * Número de días restantes.
   *
   * null cuando no puede calcularse.
   */
  remainingDays:
    number | null;

  /*
   * Porcentaje transcurrido
   * del plazo.
   */
  progress:
    number;

  badgeClassName:
    string;

  dotClassName:
    string;

  progressClassName:
    string;
};

/*
 * Calcula el estado REAL del periodo
 * de presentación de solicitudes
 * utilizando las fechas.
 *
 * No depende del estado oficial CIDO.
 *
 * currentDate: día de calendario de
 * Catalunya a las 00:00 UTC (ver
 * getCataloniaCalendarDate). Por
 * defecto, el día actual; se indica
 * en los tests.
 */
export function getApplicationPeriodPresentation(
  applicationStartDate:
    | Date
    | null
    | undefined,

  applicationEndDate:
    | Date
    | null
    | undefined,

  currentDate: Date =
    getCataloniaCalendarDate(),
): ApplicationPeriodPresentation {
  const startDay =
    getDateDayNumber(
      applicationStartDate,
    );

  const endDay =
    getDateDayNumber(
      applicationEndDate,
    );

  /*
   * No tenemos fechas.
   */
  if (
    startDay === null &&
    endDay === null
  ) {
    return {
      state:
        "unknown",

      label:
        "Plazo no disponible",

      detail:
        "Sin información de fechas",

      remainingDays:
        null,

      progress:
        0,

      badgeClassName:
        "border border-[#DDE1E8] bg-[#F4F6F9] text-[#69738A]",

      dotClassName:
        "bg-[#9AA2B1]",

      progressClassName:
        "bg-[#9AA2B1]",
    };
  }

  const today =
    getDateDayNumber(
      currentDate,
    ) ??
    getCataloniaDayNumber();

  /*
   * Todavía no ha empezado.
   */
  if (
    startDay !== null &&
    today < startDay
  ) {
    const daysUntilStart =
      startDay -
      today;

    return {
      state:
        "future",

      label:
        "Próximamente",

      detail:
        daysUntilStart ===
        1
          ? "Empieza mañana"
          : `Empieza en ${daysUntilStart} días`,

      remainingDays:
        null,

      progress:
        0,

      badgeClassName:
        "border border-[#DDE1FA] bg-[#EEF0FC] text-[#3B45B5]",

      dotClassName:
        "bg-[#4F5BD5]",

      progressClassName:
        "bg-[#4F5BD5]",
    };
  }

  /*
   * El plazo ya terminó.
   */
  if (
    endDay !== null &&
    today > endDay
  ) {
    return {
      state:
        "closed",

      label:
        "Plazo finalizado",

      detail:
        applicationEndDate
          ? `Finalizó el ${formatCalendarDate(
              applicationEndDate,
            )}`
          : "Plazo finalizado",

      remainingDays:
        0,

      progress:
        100,

      badgeClassName:
        "border border-[#DDE1E8] bg-[#EFF1F4] text-[#626C7E]",

      dotClassName:
        "bg-[#8A92A2]",

      progressClassName:
        "bg-[#8A92A2]",
    };
  }

  /*
   * Tenemos fecha final y
   * todavía no ha terminado.
   *
   * Por tanto, el plazo está abierto.
   */
  if (
    endDay !== null
  ) {
    const remainingDays =
      Math.max(
        0,
        endDay -
          today,
      );

    let progress =
      0;

    /*
     * Calculamos cuánto ha avanzado
     * el periodo cuando conocemos
     * inicio y fin.
     */
    if (
      startDay !== null &&
      endDay >
        startDay
    ) {
      const totalDays =
        endDay -
        startDay;

      const elapsedDays =
        Math.max(
          0,
          Math.min(
            totalDays,
            today -
              startDay,
          ),
        );

      progress =
        Math.round(
          (
            elapsedDays /
            totalDays
          ) *
            100,
        );
    }

    /*
     * Último día.
     *
     * Lo destacaremos especialmente
     * en rojo porque requiere atención.
     */
    if (
      remainingDays === 0
    ) {
      return {
        state:
          "open",

        label:
          "Finaliza hoy",

        detail:
          "Último día para presentar la solicitud",

        remainingDays:
          0,

        progress:
          100,

        badgeClassName:
          "border border-[#F6D0CC] bg-[#FDECEC] text-[#B42318]",

        dotClassName:
          "bg-[#D92D20]",

        progressClassName:
          "bg-[#D92D20]",
      };
    }

    /*
     * Queda solamente un día.
     */
    if (
      remainingDays === 1
    ) {
      return {
        state:
          "open",

        label:
          "Plazo abierto",

        detail:
          "Finaliza mañana",

        remainingDays:
          1,

        progress,

        badgeClassName:
          "border border-[#F7DFAC] bg-[#FFF4DB] text-[#9A6700]",

        dotClassName:
          "bg-[#E9A100]",

        progressClassName:
          "bg-[#E9A100]",
      };
    }

    /*
     * Quedan pocos días.
     *
     * También utilizamos ámbar
     * para llamar la atención.
     */
    if (
      remainingDays <= 3
    ) {
      return {
        state:
          "open",

        label:
          "Plazo abierto",

        detail:
          `Quedan ${remainingDays} días`,

        remainingDays,

        progress,

        badgeClassName:
          "border border-[#F7DFAC] bg-[#FFF4DB] text-[#9A6700]",

        dotClassName:
          "bg-[#E9A100]",

        progressClassName:
          "bg-[#E9A100]",
      };
    }

    /*
     * Plazo abierto normal.
     */
    return {
      state:
        "open",

      label:
        "Plazo abierto",

      detail:
        `Quedan ${remainingDays} días`,

      remainingDays,

      progress,

      badgeClassName:
        "border border-[#CDE8D8] bg-[#E6F4EC] text-[#1B7A4B]",

      dotClassName:
        "bg-[#23A26B]",

      progressClassName:
        "bg-[#23A26B]",
    };
  }

  /*
   * Tenemos inicio, pero CIDO
   * no proporciona fecha final.
   *
   * Si ya ha empezado,
   * consideramos el plazo iniciado.
   */
  if (
    startDay !== null &&
    today >= startDay
  ) {
    return {
      state:
        "open",

      label:
        "Plazo iniciado",

      detail:
        "Sin fecha de finalización",

      remainingDays:
        null,

      progress:
        0,

      badgeClassName:
        "border border-[#CDE8D8] bg-[#E6F4EC] text-[#1B7A4B]",

      dotClassName:
        "bg-[#23A26B]",

      progressClassName:
        "bg-[#23A26B]",
    };
  }

  return {
    state:
      "unknown",

    label:
      "Plazo no disponible",

    detail:
      "No se puede determinar el plazo",

    remainingDays:
      null,

    progress:
      0,

    badgeClassName:
      "border border-[#DDE1E8] bg-[#F4F6F9] text-[#69738A]",

    dotClassName:
      "bg-[#9AA2B1]",

    progressClassName:
      "bg-[#9AA2B1]",
  };
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

/*
 * Elimina:
 *
 * - mayúsculas
 * - acentos
 * - espacios adicionales
 *
 * para poder interpretar textos
 * de estado de forma tolerante.
 */
function normalizeStatus(
  value: string,
): string {
  return value
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " ",
    );
}

function includesAny(
  value: string,
  fragments: string[],
): boolean {
  return fragments.some(
    (
      fragment,
    ) =>
      value.includes(
        fragment,
      ),
  );
}

/*
 * Convierte una fecha en un
 * número de día independiente
 * de horas y minutos.
 */
function getDateDayNumber(
  date:
    | Date
    | null
    | undefined,
): number | null {
  if (!date) {
    return null;
  }

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return Math.floor(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ) /
      MILLISECONDS_PER_DAY,
  );
}
