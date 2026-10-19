
import type {
  DashboardLatestPublicationItem,
  DashboardQueryRepository,
} from "./dashboard-query-repository";

/**
 * ============================================================
 * SPEC-009 — DASHBOARD DEL OPOSITOR
 * ============================================================
 *
 * Caso de uso:
 * GetDashboardLatestPublications
 *
 * Obtiene las últimas publicaciones oficiales
 * de las convocatorias seguidas por un usuario.
 */

/**
 * Número máximo de publicaciones
 * que mostrará el dashboard.
 */
const MAX_LATEST_PUBLICATIONS = 5;

/**
 * Parámetros de entrada.
 */
export type GetDashboardLatestPublicationsInput = {
  userId: string;
};

/**
 * Resultado del caso de uso.
 */
export type DashboardLatestPublications = {
  publications: DashboardLatestPublicationItem[];
};

/**
 * Recupera las publicaciones oficiales
 * más recientes del usuario.
 *
 * El repositorio se encarga de:
 *
 * - Filtrar por el usuario.
 * - Incluir solo documentos activos.
 * - Respetar la fecha local de seguimiento.
 * - Ordenar por fecha e identificador.
 * - Aplicar el límite de resultados.
 *
 * Este caso de uso no depende de Prisma.
 */
export class GetDashboardLatestPublications {
  constructor(
    private readonly repository:
      DashboardQueryRepository,
  ) {}

  async execute(
    input: GetDashboardLatestPublicationsInput,
  ): Promise<DashboardLatestPublications> {
    /**
     * Normalizar el identificador del usuario.
     */
    const userId = input.userId.trim();

    if (!userId) {
      throw new Error("userId is required");
    }

    /**
     * Solicitar las cinco publicaciones
     * oficiales más recientes.
     *
     * Los filtros y la ordenación
     * se aplican en PostgreSQL.
     */
    const publications =
      await this.repository
        .listLatestOfficialPublications({
          userId,
          limit: MAX_LATEST_PUBLICATIONS,
        });

    return {
      publications,
    };
  }
}
