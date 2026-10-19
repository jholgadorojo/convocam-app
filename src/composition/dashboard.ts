
import { GetPublicDashboardCounts } from
  "@/modules/dashboard/application/get-public-dashboard-counts";

import { listActiveSelectionProcessesUseCase } from
  "@/composition/selection-process";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Composition Root.
 *
 * Conecta los casos de uso del dashboard
 * con los servicios existentes de Convoca'm.
 */

/**
 * Contadores públicos.
 *
 * Reutilizamos el caso de uso de búsqueda
 * desarrollado en SPEC-004.
 *
 * No creamos otro repositorio Prisma.
 *
 * No necesita autenticación.
 */
export const getPublicDashboardCountsUseCase =
  new GetPublicDashboardCounts(
    listActiveSelectionProcessesUseCase,
  );
