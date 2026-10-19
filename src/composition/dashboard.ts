
import { prisma } from
  "@/shared/infrastructure/database/prisma";

import { listActiveSelectionProcessesUseCase } from
  "@/composition/selection-process";

import { GetPublicDashboardCounts } from
  "@/modules/dashboard/application/get-public-dashboard-counts";

import { GetPersonalDashboardDeadlines } from
  "@/modules/dashboard/application/get-personal-dashboard-deadlines";

import { GetDashboardLatestPublications } from
  "@/modules/dashboard/application/get-dashboard-latest-publications";

import { PrismaDashboardQueryRepository } from
  "@/modules/dashboard/infrastructure/prisma/prisma-dashboard-query-repository";

/**
 * ============================================================
 * SPEC-009 — DASHBOARD DEL OPOSITOR
 * ============================================================
 *
 * Composition Root del dashboard.
 *
 * Conecta los casos de uso de Application
 * con los repositorios de Infrastructure.
 *
 * No contiene lógica de negocio.
 */

/**
 * ============================================================
 * 1. CONTADORES PÚBLICOS
 * ============================================================
 *
 * Disponibles también para visitantes
 * que no han iniciado sesión.
 *
 * Reutilizamos el buscador desarrollado
 * en SPEC-004.
 *
 * Estados oficiales CIDO:
 *
 * 2 = Pendiente de plazo.
 * 3 = Plazo abierto.
 */
export const getPublicDashboardCountsUseCase =
  new GetPublicDashboardCounts(
    listActiveSelectionProcessesUseCase,
  );

/**
 * ============================================================
 * 2. REPOSITORIO PERSONAL DEL DASHBOARD
 * ============================================================
 *
 * Implementación Prisma.
 *
 * Se comparte entre los casos de uso
 * que necesitan información personal.
 *
 * Todos los filtros por usuario
 * se aplican en PostgreSQL.
 */
const dashboardQueryRepository =
  new PrismaDashboardQueryRepository(prisma);

/**
 * ============================================================
 * 3. SEGUIMIENTOS Y PLAZOS PRÓXIMOS
 * ============================================================
 *
 * Obtiene:
 *
 * - Total de convocatorias seguidas.
 * - Total de plazos próximos.
 * - Cinco convocatorias cuyo plazo
 *   finaliza más pronto.
 *
 * El intervalo de 15 días naturales
 * se calcula según Europe/Madrid.
 *
 * Solo considera los estados personales:
 *
 * - INTERESTED
 * - PREPARING_APPLICATION
 */
export const getPersonalDashboardDeadlinesUseCase =
  new GetPersonalDashboardDeadlines(
    dashboardQueryRepository,
  );

/**
 * ============================================================
 * 4. ÚLTIMAS PUBLICACIONES OFICIALES
 * ============================================================
 *
 * Obtiene los cinco documentos oficiales
 * más recientes de las convocatorias
 * que sigue el usuario.
 *
 * El repositorio aplica las condiciones:
 *
 * - Documentos activos en CIDO.
 * - Convocatorias seguidas por el usuario.
 * - Publicaciones desde el día local
 *   en que comenzó el seguimiento.
 *
 * Se permiten varios documentos
 * de una misma convocatoria.
 *
 * Ordenación:
 *
 * 1. Fecha de publicación descendente.
 * 2. Identificador de documento descendente.
 */
export const getDashboardLatestPublicationsUseCase =
  new GetDashboardLatestPublications(
    dashboardQueryRepository,
  );
