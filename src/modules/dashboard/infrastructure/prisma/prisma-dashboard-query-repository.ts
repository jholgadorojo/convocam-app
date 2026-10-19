
import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";

import type {
  DashboardLatestPublicationItem,
  DashboardLatestPublicationsQuery,
  DashboardQueryRepository,
  DashboardUpcomingDeadlineItem,
  DashboardUpcomingDeadlinesQuery,
} from "../../application/dashboard-query-repository";

/**
 * SPEC-009 — Dashboard del opositor.
 *
 * Repositorio Prisma para las consultas
 * personales del dashboard.
 *
 * Responsabilidades:
 *
 * 1. Contar convocatorias seguidas.
 * 2. Contar plazos próximos.
 * 3. Listar plazos próximos.
 * 4. Listar últimas publicaciones oficiales.
 */
export class PrismaDashboardQueryRepository
  implements DashboardQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * ============================================================
   * 1. CONTADOR: EN SEGUIMIENTO
   * ============================================================
   *
   * Cuenta todas las convocatorias seguidas
   * por el usuario.
   *
   * No filtra por fechas, estado personal
   * ni estado oficial de CIDO.
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
   * 2. CONTADOR: PLAZOS PRÓXIMOS
   * ============================================================
   *
   * Cuenta los seguimientos que cumplen:
   *
   * - Usuario indicado.
   * - Estado personal permitido.
   * - Fecha final dentro del intervalo.
   *
   * Incluye ambos extremos del intervalo.
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
   * 3. LISTADO: PLAZOS PRÓXIMOS
   * ============================================================
   *
   * Ordena por:
   *
   * 1. applicationEndDate ascendente.
   * 2. selectionProcessId ascendente.
   *
   * Recupera únicamente el número de
   * convocatorias solicitado.
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
   * 4. LISTADO: ÚLTIMAS PUBLICACIONES OFICIALES
   * ============================================================
   *
   * Recupera documentos oficiales de las
   * convocatorias seguidas por el usuario.
   *
   * Condiciones:
   *
   * - Seguimiento perteneciente al usuario.
   * - Documento activo en CIDO.
   * - Publicación realizada desde el día
   *   local en que comenzó el seguimiento.
   *
   * Incluye publicaciones del mismo día
   * en que se siguió la convocatoria.
   *
   * Ordenación:
   *
   * 1. publicationDate DESC.
   * 2. documentId DESC.
   *
   * El límite se aplica en PostgreSQL.
   */
  async listLatestOfficialPublications(
    query: DashboardLatestPublicationsQuery,
  ): Promise<DashboardLatestPublicationItem[]> {
    const userId = query.userId.trim();

    if (!userId) {
      throw new Error("userId is required");
    }

    if (
      !Number.isInteger(query.limit) ||
      query.limit < 1 ||
      query.limit > 100
    ) {
      throw new Error(
        "limit must be an integer between 1 and 100",
      );
    }

    /**
     * Usamos SQL parametrizado porque necesitamos
     * comparar dos campos de tablas diferentes:
     *
     * - Documento: publicationDate (DATE).
     * - Seguimiento: followedAt (DateTime).
     *
     * followed_at utiliza el tipo PostgreSQL
     * timestamp sin zona horaria.
     *
     * Interpretamos su valor como UTC y
     * lo convertimos al calendario de Catalunya.
     *
     * El resultado es únicamente la fecha
     * local, sin considerar la hora.
     *
     * Las variables userId y limit se envían
     * como parámetros seguros de Prisma.
     */
    const publications =
      await this.prisma.$queryRaw<
        DashboardLatestPublicationItem[]
      >(
        Prisma.sql`
          SELECT
            document.id
              AS "documentId",

            document."selectionProcessId"
              AS "selectionProcessId",

            selection_process.title
              AS "selectionProcessTitle",

            institution.municipality
              AS "municipality",

            document."publicationDate"
              AS "publicationDate",

            document.summary
              AS "summary",

            document.phase
              AS "phase",

            document."documentUrl"
              AS "documentUrl"

          FROM "selection_process_documents"
            AS document

          INNER JOIN "user_selection_processes"
            AS following
            ON following.selection_process_id =
              document."selectionProcessId"

          INNER JOIN "selection_processes"
            AS selection_process
            ON selection_process.id =
              document."selectionProcessId"

          LEFT JOIN "institutions"
            AS institution
            ON institution.id =
              selection_process."institutionId"

          WHERE
            following.user_id = ${userId}

            AND document."sourceActive" = TRUE

            AND document."publicationDate" >= (
              (
                following.followed_at
                  AT TIME ZONE 'UTC'
                  AT TIME ZONE 'Europe/Madrid'
              )::date
            )

          ORDER BY
            document."publicationDate" DESC,
            document.id DESC

          LIMIT ${query.limit}
        `,
      );

    return publications;
  }

  /**
   * ============================================================
   * 5. FILTRO COMPARTIDO: PLAZOS PRÓXIMOS
   * ============================================================
   *
   * Es utilizado por el contador y el listado.
   *
   * De esta manera, ambos consultan exactamente
   * las mismas convocatorias.
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
