
import type { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

/**
 * ============================================================
 * SPEC-009 — DASHBOARD DEL OPOSITOR
 * ============================================================
 *
 * Contrato de consultas del dashboard.
 *
 * Define los datos que necesita la aplicación.
 *
 * Las consultas reales a PostgreSQL
 * se implementan en Infrastructure.
 */

/**
 * ============================================================
 * 1. PLAZOS PRÓXIMOS
 * ============================================================
 */

/**
 * Criterios de búsqueda de plazos próximos.
 */
export type DashboardUpcomingDeadlinesQuery = {
  userId: string;

  /**
   * Fecha inicial incluida.
   *
   * Representa una fecha de calendario
   * normalizada a las 00:00 UTC.
   */
  fromDate: Date;

  /**
   * Fecha final incluida.
   *
   * El dashboard utilizará hoy + 15 días
   * naturales según el calendario
   * de Catalunya.
   */
  toDate: Date;

  /**
   * Estados personales permitidos.
   *
   * Para SPEC-009:
   *
   * INTERESTED
   * PREPARING_APPLICATION
   */
  personalStatuses:
    readonly PersonalSelectionProcessStatus[];
};

/**
 * Datos de una convocatoria
 * con plazo próximo.
 */
export type DashboardUpcomingDeadlineItem = {
  selectionProcessId: number;

  title: string;

  municipality: string | null;

  applicationEndDate: Date;

  personalStatus: PersonalSelectionProcessStatus;
};

/**
 * ============================================================
 * 2. ÚLTIMAS PUBLICACIONES OFICIALES
 * ============================================================
 */

/**
 * Criterios de consulta de documentos oficiales.
 */
export type DashboardLatestPublicationsQuery = {
  /**
   * Usuario autenticado.
   *
   * Solo se consultan documentos
   * de sus convocatorias seguidas.
   */
  userId: string;

  /**
   * Número máximo de publicaciones.
   *
   * En SPEC-009 utilizaremos 5.
   */
  limit: number;
};

/**
 * Datos que necesita el dashboard
 * para mostrar una publicación oficial.
 */
export type DashboardLatestPublicationItem = {
  /**
   * Identificador del documento CIDO
   * en nuestra base de datos.
   */
  documentId: number;

  /**
   * Convocatoria relacionada.
   */
  selectionProcessId: number;

  /**
   * Título completo de la convocatoria.
   */
  selectionProcessTitle: string;

  /**
   * Municipio de la institución.
   *
   * Puede ser null si CIDO
   * no proporciona este dato.
   */
  municipality: string | null;

  /**
   * Fecha oficial de publicación.
   *
   * Procede de publicationDate,
   * un campo DATE de PostgreSQL.
   */
  publicationDate: Date;

  /**
   * Resumen oficial del documento.
   */
  summary: string;

  /**
   * Fase oficial CIDO.
   */
  phase: string;

  /**
   * URL original del documento oficial.
   *
   * No almacenamos el archivo PDF.
   */
  documentUrl: string;
};

/**
 * ============================================================
 * 3. CONTRATO DEL REPOSITORIO
 * ============================================================
 *
 * La aplicación define las operaciones.
 *
 * Prisma se encargará de implementarlas
 * utilizando PostgreSQL.
 */
export interface DashboardQueryRepository {
  /**
   * ----------------------------------------------------------
   * CONTADOR: EN SEGUIMIENTO
   * ----------------------------------------------------------
   *
   * Cuenta todas las convocatorias
   * que sigue un usuario.
   *
   * No filtra por estado personal,
   * plazo ni estado oficial.
   */
  countFollowedByUser(
    userId: string,
  ): Promise<number>;

  /**
   * ----------------------------------------------------------
   * CONTADOR: PLAZOS PRÓXIMOS
   * ----------------------------------------------------------
   *
   * Cuenta las convocatorias seguidas
   * que cumplen los criterios indicados.
   *
   * El intervalo de fechas es inclusivo.
   */
  countUpcomingDeadlines(
    query: DashboardUpcomingDeadlinesQuery,
  ): Promise<number>;

  /**
   * ----------------------------------------------------------
   * LISTADO: PLAZOS PRÓXIMOS
   * ----------------------------------------------------------
   *
   * Obtiene las convocatorias con
   * vencimiento más cercano.
   *
   * Ordenación:
   *
   * 1. applicationEndDate ASC
   * 2. selectionProcessId ASC
   */
  listUpcomingDeadlines(
    query: DashboardUpcomingDeadlinesQuery & {
      limit: number;
    },
  ): Promise<DashboardUpcomingDeadlineItem[]>;

  /**
   * ----------------------------------------------------------
   * LISTADO: ÚLTIMAS PUBLICACIONES OFICIALES
   * ----------------------------------------------------------
   *
   * Recupera los documentos oficiales
   * más recientes de las convocatorias
   * que sigue el usuario.
   *
   * Reglas:
   *
   * 1. El seguimiento pertenece al usuario.
   *
   * 2. El documento tiene sourceActive = true.
   *
   * 3. publicationDate debe ser igual o posterior
   *    al día local de Catalunya en el que el
   *    usuario comenzó a seguir la convocatoria.
   *
   * 4. Se permiten varios documentos
   *    de una misma convocatoria.
   *
   * 5. No se filtra por el estado personal
   *    ni por el estado oficial del proceso.
   *
   * Ordenación:
   *
   * 1. publicationDate DESC
   * 2. documentId DESC
   *
   * El límite se aplica en PostgreSQL,
   * después de filtrar y ordenar.
   */
  listLatestOfficialPublications(
    query: DashboardLatestPublicationsQuery,
  ): Promise<DashboardLatestPublicationItem[]>;
}
