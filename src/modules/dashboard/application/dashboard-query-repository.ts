
import type { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Criterios para consultar los plazos próximos
 * de las convocatorias que sigue un usuario.
 */
export type DashboardUpcomingDeadlinesQuery = {
  userId: string;

  /**
   * Primera fecha incluida en la consulta.
   *
   * Se representará como una fecha de calendario
   * normalizada a las 00:00 UTC.
   */
  fromDate: Date;

  /**
   * Última fecha incluida en la consulta.
   *
   * Para SPEC-009 será hoy + 15 días naturales,
   * según el calendario de Catalunya.
   */
  toDate: Date;

  /**
   * Estados personales que deben incluirse.
   *
   * En el dashboard utilizaremos:
   *
   * INTERESTED
   * PREPARING_APPLICATION
   */
  personalStatuses:
    readonly PersonalSelectionProcessStatus[];
};

/**
 * Información necesaria para mostrar una convocatoria
 * en el panel "Plazos próximos".
 */
export type DashboardUpcomingDeadlineItem = {
  selectionProcessId: number;

  title: string;

  municipality: string | null;

  applicationEndDate: Date;

  personalStatus: PersonalSelectionProcessStatus;
};

/**
 * Contrato de lectura de información personal
 * para el dashboard.
 *
 * La aplicación define qué necesita.
 *
 * La infraestructura Prisma implementará
 * posteriormente cómo obtenerlo desde PostgreSQL.
 */
export interface DashboardQueryRepository {
  /**
   * Cuenta todas las convocatorias seguidas
   * por el usuario.
   *
   * No filtra por estado personal ni por fechas.
   */
  countFollowedByUser(
    userId: string,
  ): Promise<number>;

  /**
   * Cuenta las convocatorias seguidas
   * que cumplen los criterios de plazo próximo.
   *
   * El intervalo de fechas es inclusivo.
   */
  countUpcomingDeadlines(
    query: DashboardUpcomingDeadlinesQuery,
  ): Promise<number>;

  /**
   * Recupera las convocatorias seguidas
   * cuyos plazos finalizan próximamente.
   *
   * Se ordenarán por applicationEndDate ascendente.
   *
   * El límite permitirá recuperar solamente
   * las cinco primeras para el dashboard.
   */
  listUpcomingDeadlines(
    query: DashboardUpcomingDeadlinesQuery & {
      limit: number;
    },
  ): Promise<DashboardUpcomingDeadlineItem[]>;
}
