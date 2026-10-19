
import { ListActiveSelectionProcesses } from
  "@/modules/selection-process/application/list-active-selection-processes";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Contadores públicos de convocatorias CIDO.
 *
 * No contienen información personal
 * y están disponibles sin autenticación.
 */
export type PublicDashboardCounts = {
  openCount: number;
  pendingCount: number;
};

/**
 * Estados oficiales CIDO confirmados:
 *
 * 2 = Pendent de termini
 * 3 = Termini obert
 */
const CIDO_PENDING_STATUS_ID = 2;
const CIDO_OPEN_STATUS_ID = 3;

/**
 * Recupera los contadores públicos del dashboard.
 *
 * Reutiliza el buscador existente para:
 *
 * - Consultar únicamente convocatorias activas.
 * - Filtrar por el estado oficial CIDO.
 * - Obtener el total real de coincidencias.
 *
 * No aplica filtros personales.
 */
export class GetPublicDashboardCounts {
  constructor(
    private readonly listActiveSelectionProcesses:
      ListActiveSelectionProcesses,
  ) {}

  async execute(): Promise<PublicDashboardCounts> {
    const [openResult, pendingResult] =
      await Promise.all([
        this.listActiveSelectionProcesses.execute({
          page: 1,
          pageSize: 1,
          filters: {
            statusId: [CIDO_OPEN_STATUS_ID],
          },
        }),

        this.listActiveSelectionProcesses.execute({
          page: 1,
          pageSize: 1,
          filters: {
            statusId: [CIDO_PENDING_STATUS_ID],
          },
        }),
      ]);

    return {
      openCount: openResult.totalItems,
      pendingCount: pendingResult.totalItems,
    };
  }
}
