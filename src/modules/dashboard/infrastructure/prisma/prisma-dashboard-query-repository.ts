
import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

import type {
  DashboardQueryRepository,
  DashboardUpcomingDeadlineItem,
  DashboardUpcomingDeadlinesQuery,
} from "../../application/dashboard-query-repository";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Implementación Prisma del contrato
 * DashboardQueryRepository.
 *
 * Recupera los seguimientos personales
 * y los plazos próximos directamente
 * desde PostgreSQL.
 */
export class PrismaDashboardQueryRepository
  implements DashboardQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * ============================================================
   * CONTADOR: EN SEGUIMIENTO
   * ============================================================
   *
   * Cuenta todas las convocatorias que sigue
   * el usuario, independientemente de:
   *
   * - Su estado personal.
   * - Las fechas del proceso.
   * - El estado oficial de CIDO.
   *
   * Incluye los seguimientos históricos.
   */
  async countFollowedByUser(
    userId: string,
  ): Promise<number> {
    return this.prisma.userSelectionProcess.count({
      where: {
        userId,
      },
    });
  }

  /**
   * ============================================================
   * CONTADOR: PLAZOS PRÓXIMOS
   * ============================================================
   *
   * Cuenta los seguimientos que cumplen:
   *
   * - Pertenecen al usuario.
   * - Tienen un estado personal permitido.
   * - Finalizan dentro del intervalo indicado.
   *
   * Los dos extremos del intervalo
   * están incluidos.
   */
  async countUpcomingDeadlines(
    query: DashboardUpcomingDeadlinesQuery,
  ): Promise<number> {
    return this.prisma.userSelectionProcess.count({
      where: this.buildUpcomingWhere(query),
    });
  }

  /**
   * ============================================================
   * LISTADO: PLAZOS PRÓXIMOS
   * ============================================================
   *
   * Recupera solamente las convocatorias
   * necesarias para el dashboard.
   *
   * Ordenación:
   * 1. Fecha de finalización ascendente.
   * 2. Identificador de convocatoria ascendente.
   *
   * La segunda condición garantiza un orden
   * estable cuando coinciden las fechas.
   */
  async listUpcomingDeadlines(
    query: DashboardUpcomingDeadlinesQuery & {
      limit: number;
    },
  ): Promise<DashboardUpcomingDeadlineItem[]> {
    if (
      !Number.isInteger(query.limit) ||
      query.limit < 1 ||
      query.limit > 100
    ) {
      throw new Error(
        "limit must be an integer between 1 and 100",
      );
    }

    const rows =
      await this.prisma.userSelectionProcess.findMany({
        where: this.buildUpcomingWhere(query),

        orderBy: [
          {
            selectionProcess: {
              applicationEndDate: "asc",
            },
          },
          {
            selectionProcessId: "asc",
          },
        ],

        take: query.limit,

        select: {
          selectionProcessId: true,
          personalStatus: true,

          selectionProcess: {
            select: {
              title: true,
              applicationEndDate: true,

              institution: {
                select: {
                  municipality: true,
                },
              },
            },
          },
        },
      });

    /**
     * Transformar los resultados Prisma
     * al contrato de aplicación.
     *
     * El filtro de fechas garantiza que
     * applicationEndDate no sea null.
     */
    return rows.map(
      (row): DashboardUpcomingDeadlineItem => {
        const applicationEndDate =
          row.selectionProcess.applicationEndDate;

        if (applicationEndDate === null) {
          throw new Error(
            "Upcoming deadline without applicationEndDate",
          );
        }

        return {
          selectionProcessId:
            row.selectionProcessId,

          title:
            row.selectionProcess.title,

          municipality:
            row.selectionProcess.institution
              ?.municipality ?? null,

          applicationEndDate,

          personalStatus:
            PersonalSelectionProcessStatus[
              row.personalStatus
            ],
        };
      },
    );
  }

  /**
   * ============================================================
   * FILTRO COMPARTIDO DE PLAZOS PRÓXIMOS
   * ============================================================
   *
   * Se utiliza tanto en el contador
   * como en el listado.
   *
   * De esta manera garantizamos que
   * ambos emplean exactamente
   * los mismos criterios.
   */
  private buildUpcomingWhere(
    query: DashboardUpcomingDeadlinesQuery,
  ): Prisma.UserSelectionProcessWhereInput {
    return {
      userId: query.userId,

      personalStatus: {
        in: [...query.personalStatuses],
      },

      selectionProcess: {
        is: {
          applicationEndDate: {
            gte: query.fromDate,
            lte: query.toDate,
          },
        },
      },
    };
  }
}
