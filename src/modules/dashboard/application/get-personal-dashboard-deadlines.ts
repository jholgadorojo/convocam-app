
import { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

import type {
  DashboardQueryRepository,
  DashboardUpcomingDeadlineItem,
  DashboardUpcomingDeadlinesQuery,
} from "./dashboard-query-repository";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Configuración de los plazos próximos.
 */
const UPCOMING_DAYS = 15;
const MAX_UPCOMING_ITEMS = 5;

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

/**
 * Parámetros del caso de uso.
 */
export type GetPersonalDashboardDeadlinesInput = {
  userId: string;
};

/**
 * Convocatoria que aparecerá en el panel
 * "Plazos próximos".
 */
export type PersonalDashboardUpcomingDeadline =
  DashboardUpcomingDeadlineItem & {
    /**
     * Días naturales hasta el fin del plazo.
     *
     * 0 = finaliza hoy.
     * 1 = finaliza mañana.
     */
    daysRemaining: number;
  };

/**
 * Resultado completo del caso de uso.
 */
export type PersonalDashboardDeadlines = {
  /**
   * Total de convocatorias seguidas,
   * independientemente del estado personal.
   */
  followedCount: number;

  /**
   * Total de plazos próximos que cumplen
   * las condiciones del dashboard.
   */
  upcomingDeadlinesCount: number;

  /**
   * Las cinco convocatorias cuyo plazo
   * finaliza antes.
   */
  upcomingDeadlines:
    PersonalDashboardUpcomingDeadline[];
};

/**
 * SPEC-009 — Consultar los plazos próximos
 * del dashboard personal.
 */
export class GetPersonalDashboardDeadlines {
  constructor(
    private readonly repository:
      DashboardQueryRepository,

    /**
     * Permite controlar la fecha actual
     * desde las pruebas automatizadas.
     *
     * En la aplicación real utiliza
     * la fecha del sistema.
     */
    private readonly clock:
      () => Date = () => new Date(),
  ) {}

  async execute(
    input: GetPersonalDashboardDeadlinesInput,
  ): Promise<PersonalDashboardDeadlines> {
    const userId = input.userId.trim();

    if (!userId) {
      throw new Error("userId is required");
    }

    /**
     * Obtener el día actual en Catalunya.
     *
     * Lo representamos como una fecha
     * normalizada a las 00:00 UTC.
     *
     * Esto es compatible con los campos
     * DATE de PostgreSQL.
     */
    const today = getCataloniaTodayUtc(
      this.clock(),
    );

    /**
     * Calcular el último día incluido.
     *
     * Hoy + 15 días naturales.
     *
     * Se utilizan días UTC sobre fechas
     * normalizadas para evitar problemas
     * con los cambios de horario.
     */
    const lastDay = new Date(
      today.getTime(),
    );

    lastDay.setUTCDate(
      lastDay.getUTCDate() + UPCOMING_DAYS,
    );

    /**
     * Estados personales que deben
     * incluirse en los plazos próximos.
     */
    const personalStatuses = [
      PersonalSelectionProcessStatus.INTERESTED,
      PersonalSelectionProcessStatus.PREPARING_APPLICATION,
    ];

    /**
     * Preparar los criterios compartidos
     * por las consultas de plazos.
     */
    const query: DashboardUpcomingDeadlinesQuery = {
      userId,
      fromDate: today,
      toDate: lastDay,
      personalStatuses,
    };

    /**
     * Consultar simultáneamente:
     *
     * 1. Total de seguimientos.
     * 2. Total de plazos próximos.
     * 3. Cinco plazos con vencimiento más cercano.
     *
     * PostgreSQL realizará el filtrado,
     * el recuento y la ordenación mediante
     * el repositorio que implementaremos.
     */
    const [
      followedCount,
      upcomingDeadlinesCount,
      upcomingDeadlineItems,
    ] = await Promise.all([
      this.repository.countFollowedByUser(
        userId,
      ),

      this.repository.countUpcomingDeadlines(
        query,
      ),

      this.repository.listUpcomingDeadlines({
        ...query,
        limit: MAX_UPCOMING_ITEMS,
      }),
    ]);

    /**
     * Calcular los días restantes
     * para cada convocatoria.
     *
     * applicationEndDate es un campo
     * DATE, representado a medianoche UTC.
     */
    const upcomingDeadlines =
      upcomingDeadlineItems.map(
        (item): PersonalDashboardUpcomingDeadline => ({
          ...item,

          daysRemaining: Math.round(
            (
              item.applicationEndDate.getTime() -
              today.getTime()
            ) / MILLISECONDS_PER_DAY,
          ),
        }),
      );

    return {
      followedCount,
      upcomingDeadlinesCount,
      upcomingDeadlines,
    };
  }
}

/**
 * Obtiene la fecha del calendario actual
 * de Catalunya.
 *
 * Por ejemplo:
 *
 * Si en Catalunya es 18/10/2026,
 * devuelve 2026-10-18T00:00:00.000Z.
 *
 * No representa la medianoche física
 * de Catalunya, sino una fecha de calendario
 * codificada como UTC para trabajar
 * con los campos DATE de PostgreSQL.
 */
function getCataloniaTodayUtc(
  now: Date,
): Date {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(now);

  const year = Number(
    parts.find(
      (part) => part.type === "year",
    )?.value,
  );

  const month = Number(
    parts.find(
      (part) => part.type === "month",
    )?.value,
  );

  const day = Number(
    parts.find(
      (part) => part.type === "day",
    )?.value,
  );

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );
}
