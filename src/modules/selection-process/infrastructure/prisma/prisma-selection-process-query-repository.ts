import type {
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";

import type {
  SelectionProcessFilterOptions,
  SelectionProcessTerritoryOption,
} from "../../application/selection-process-filter-options";

import type { SelectionProcessPage } from "../../application/selection-process-page";

import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";

import type { SelectionProcessSearchFilters } from "../../application/selection-process-search-filters";

/*
 * Resultado de PostgreSQL para la búsqueda
 * tolerante.
 *
 * score indica la relevancia.
 */
type TextSearchMatch = {
  id: number;
  score: number;
};

type SelectionProcessWithInstitution =
  Prisma.SelectionProcessGetPayload<{
    include: {
      institution: true;
    };
  }>;

export class PrismaSelectionProcessQueryRepository
  implements SelectionProcessQueryRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findActive(
    page: number,
    pageSize: number,
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessPage> {
    const skip =
      (page - 1) * pageSize;

    const text =
      filters.text?.trim();

    const municipality =
      filters.municipality?.trim();

    const county =
      filters.county?.trim();

    const province =
      filters.province?.trim();

    /*
     * qualificationGroup puede llegar como:
     *
     * "A2"
     *
     * o:
     *
     * ["A2", "C1"]
     */
    const qualificationGroups =
      filters.qualificationGroup ===
      undefined
        ? []
        : Array.isArray(
              filters.qualificationGroup,
            )
          ? filters.qualificationGroup
              .map((group) =>
                group.trim(),
              )
              .filter(Boolean)
          : [
              filters.qualificationGroup.trim(),
            ].filter(Boolean);

    /*
     * Todas las condiciones normales
     * de Prisma.
     */
    const conditions:
      Prisma.SelectionProcessWhereInput[] =
      [
        {
          sourceActive: true,
        },
      ];

    /*
     * --------------------------------
     * TERRITORIO
     * --------------------------------
     *
     * Provincia, comarca y municipio
     * pertenecen a la misma Institution.
     */
    const institutionConditions:
      Prisma.InstitutionWhereInput = {};

    if (province) {
      institutionConditions.province = {
        equals: province,
        mode: "insensitive",
      };
    }

    if (county) {
      institutionConditions.county = {
        equals: county,
        mode: "insensitive",
      };
    }

    if (municipality) {
      institutionConditions.municipality =
        {
          equals: municipality,
          mode: "insensitive",
        };
    }

    if (
      province ||
      county ||
      municipality
    ) {
      conditions.push({
        institution: {
          is: institutionConditions,
        },
      });
    }

    /*
     * --------------------------------
     * ESTADO
     * --------------------------------
     */
    if (
      filters.statusId !== undefined
    ) {
      conditions.push({
        statusId: filters.statusId,
      });
    }

    /*
     * --------------------------------
     * ÁMBITO
     * --------------------------------
     */
    if (
      filters.scopeId !== undefined
    ) {
      conditions.push({
        scopeId: filters.scopeId,
      });
    }

    /*
     * --------------------------------
     * SISTEMA DE SELECCIÓN
     * --------------------------------
     */
    if (
      filters.selectionSystemId !==
      undefined
    ) {
      conditions.push({
        selectionSystemId:
          filters.selectionSystemId,
      });
    }

    /*
     * --------------------------------
     * TIPO DE PERSONAL
     * --------------------------------
     */
    if (
      filters.personnelTypeId !==
      undefined
    ) {
      conditions.push({
        personnelTypeId:
          filters.personnelTypeId,
      });
    }

    /*
     * --------------------------------
     * GRUPO DE TITULACIÓN
     * --------------------------------
     */
    if (
      qualificationGroups.length > 0
    ) {
      conditions.push({
        qualificationGroup: {
          in: qualificationGroups,
        },
      });
    }

    /*
     * --------------------------------
     * PLAZA / BOLSA
     * --------------------------------
     */
    if (
      filters.isJobPool !== undefined
    ) {
      conditions.push({
        isJobPool:
          filters.isJobPool,
      });
    }

    /*
     * --------------------------------
     * FECHA LÍMITE
     * --------------------------------
     */
    if (
      filters.applicationEndDateFrom ||
      filters.applicationEndDateTo
    ) {
      conditions.push({
        applicationEndDate: {
          ...(filters.applicationEndDateFrom
            ? {
                gte:
                  filters.applicationEndDateFrom,
              }
            : {}),

          ...(filters.applicationEndDateTo
            ? {
                lte:
                  filters.applicationEndDateTo,
              }
            : {}),
        },
      });
    }

    /*
     * --------------------------------
     * RESERVA DISCAPACIDAD
     * --------------------------------
     */
    if (
      filters.reservedDisability !==
      undefined
    ) {
      conditions.push({
        reservedDisabilityPositions:
          filters.reservedDisability
            ? {
                gt: 0,
              }
            : 0,
      });
    }

    /*
     * --------------------------------
     * RESERVA DESEMPLEADOS
     * --------------------------------
     */
    if (
      filters.reservedUnemployed !==
      undefined
    ) {
      conditions.push({
        reservedUnemployed:
          filters.reservedUnemployed,
      });
    }

    /*
     * --------------------------------
     * RESERVA JÓVENES
     * --------------------------------
     */
    if (
      filters.reservedYoung !==
      undefined
    ) {
      conditions.push({
        reservedYoung:
          filters.reservedYoung,
      });
    }

    /*
     * --------------------------------
     * RESERVA MUJERES
     * --------------------------------
     */
    if (
      filters.reservedWomen !==
      undefined
    ) {
      conditions.push({
        reservedWomen:
          filters.reservedWomen,
      });
    }

    /*
     * Filtro Prisma completo.
     *
     * No incluye la búsqueda de texto.
     *
     * La búsqueda tolerante se ejecuta
     * mediante PostgreSQL.
     */
    const where:
      Prisma.SelectionProcessWhereInput =
      {
        AND: conditions,
      };

    /*
     * ========================================
     * BÚSQUEDA CON TEXTO
     * ========================================
     *
     * Si existe q, primero calculamos
     * relevancia mediante:
     *
     * unaccent
     * pg_trgm
     * word_similarity
     *
     * Después aplicamos los filtros Prisma.
     */
    if (text) {
      const textMatches =
        await this.findTextMatches(
          text,
        );

      if (
        textMatches.length === 0
      ) {
        return {
          items: [],
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
        };
      }

      /*
       * Estos IDs YA están ordenados
       * por relevancia.
       */
      const rankedIds =
        textMatches.map(
          (match) => match.id,
        );

      /*
       * Aplicamos ahora:
       *
       * territorio
       * estado
       * grupo
       * plaza/bolsa
       * fechas
       * reservas
       * etc.
       */
      const eligibleRows =
        await this.prisma.selectionProcess.findMany(
          {
            where: {
              AND: [
                where,
                {
                  id: {
                    in: rankedIds,
                  },
                },
              ],
            },

            select: {
              id: true,
            },
          },
        );

      const eligibleIds =
        new Set(
          eligibleRows.map(
            (row) => row.id,
          ),
        );

      /*
       * Conservamos el ranking original
       * pero quitamos las convocatorias
       * que no pasan los otros filtros.
       */
      const filteredRankedIds =
        rankedIds.filter((id) =>
          eligibleIds.has(id),
        );

      const totalItems =
        filteredRankedIds.length;

      const totalPages =
        totalItems === 0
          ? 0
          : Math.ceil(
              totalItems /
                pageSize,
            );

      const start =
        (page - 1) * pageSize;

      const pageIds =
        filteredRankedIds.slice(
          start,
          start + pageSize,
        );

      if (
        pageIds.length === 0
      ) {
        return {
          items: [],
          page,
          pageSize,
          totalItems,
          totalPages,
        };
      }

      /*
       * Recuperamos los datos completos
       * de esta página.
       */
      const rows =
        await this.prisma.selectionProcess.findMany(
          {
            where: {
              id: {
                in: pageIds,
              },
            },

            include: {
              institution: true,
            },
          },
        );

      /*
       * Prisma no garantiza que:
       *
       * WHERE id IN (...)
       *
       * respete el orden de pageIds.
       *
       * Restauramos el ranking.
       */
      const positionById =
        new Map(
          pageIds.map(
            (id, index) => [
              id,
              index,
            ],
          ),
        );

      rows.sort(
        (a, b) =>
          (positionById.get(
            a.id,
          ) ??
            Number.MAX_SAFE_INTEGER) -
          (positionById.get(
            b.id,
          ) ??
            Number.MAX_SAFE_INTEGER),
      );

      return {
        items: rows.map(
          mapSelectionProcessListItem,
        ),

        page,
        pageSize,
        totalItems,
        totalPages,
      };
    }

    /*
     * ========================================
     * SIN TEXTO
     * ========================================
     *
     * Si no hay búsqueda libre,
     * utilizamos el orden normal:
     *
     * fecha límite
     * id
     */
    const [rows, totalItems] =
      await this.prisma.$transaction([
        this.prisma.selectionProcess.findMany(
          {
            where,

            include: {
              institution: true,
            },

            orderBy: [
              {
                applicationEndDate: {
                  sort: "asc",
                  nulls: "last",
                },
              },
              {
                id: "asc",
              },
            ],

            skip,
            take: pageSize,
          },
        ),

        this.prisma.selectionProcess.count(
          {
            where,
          },
        ),
      ]);

    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(
            totalItems /
              pageSize,
          );

    return {
      items: rows.map(
        mapSelectionProcessListItem,
      ),

      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  /*
   * ========================================
   * BÚSQUEDA TOLERANTE + RELEVANCIA
   * ========================================
   */
  private async findTextMatches(
    text: string,
  ): Promise<TextSearchMatch[]> {
    /*
     * Ejemplo:
     *
     * "cardedeu informatic"
     *
     * =>
     *
     * ["cardedeu", "informatic"]
     */
    const terms = [
      ...new Set(
        text
          .trim()
          .split(/\s+/)
          .map((term) =>
            term.trim(),
          )
          .filter(Boolean),
      ),
    ];

    if (
      terms.length === 0
    ) {
      return [];
    }

    /*
     * ID -> puntuación acumulada.
     */
    let accumulatedScores:
      | Map<number, number>
      | undefined;

    /*
     * Cada palabra debe encontrarse.
     *
     * Es decir:
     *
     * cardedeu AND informatic
     */
    for (const term of terms) {
      const rows =
        await this.prisma.$queryRaw<
          TextSearchMatch[]
        >`
          WITH scored AS (
            SELECT
              sp.id,

              GREATEST(

                /*
                 * =========================
                 * TÍTULO
                 * =========================
                 *
                 * Es el campo más importante.
                 */

                CASE
                  WHEN
                    unaccent(
                      lower(
                        COALESCE(
                          sp.title,
                          ''
                        )
                      )
                    )
                    LIKE
                    '%' ||
                    unaccent(
                      lower(${term})
                    ) ||
                    '%'
                  THEN 2.0
                  ELSE 0.0
                END,

                CASE
                  WHEN
                    char_length(${term}) >= 4
                  THEN
                    word_similarity(
                      unaccent(
                        lower(${term})
                      ),
                      unaccent(
                        lower(
                          COALESCE(
                            sp.title,
                            ''
                          )
                        )
                      )
                    ) * 1.5
                  ELSE 0.0
                END,

                /*
                 * =========================
                 * ORGANISMO
                 * =========================
                 */

                CASE
                  WHEN
                    unaccent(
                      lower(
                        COALESCE(
                          i.name,
                          ''
                        )
                      )
                    )
                    LIKE
                    '%' ||
                    unaccent(
                      lower(${term})
                    ) ||
                    '%'
                  THEN 1.4
                  ELSE 0.0
                END,

                CASE
                  WHEN
                    char_length(${term}) >= 4
                  THEN
                    word_similarity(
                      unaccent(
                        lower(${term})
                      ),
                      unaccent(
                        lower(
                          COALESCE(
                            i.name,
                            ''
                          )
                        )
                      )
                    ) * 1.1
                  ELSE 0.0
                END,

                /*
                 * =========================
                 * MUNICIPIO
                 * =========================
                 */

                CASE
                  WHEN
                    unaccent(
                      lower(
                        COALESCE(
                          i.municipality,
                          ''
                        )
                      )
                    )
                    LIKE
                    '%' ||
                    unaccent(
                      lower(${term})
                    ) ||
                    '%'
                  THEN 1.0
                  ELSE 0.0
                END,

                CASE
                  WHEN
                    char_length(${term}) >= 4
                  THEN
                    word_similarity(
                      unaccent(
                        lower(${term})
                      ),
                      unaccent(
                        lower(
                          COALESCE(
                            i.municipality,
                            ''
                          )
                        )
                      )
                    )
                  ELSE 0.0
                END,

                /*
                 * =========================
                 * COMARCA
                 * =========================
                 */

                CASE
                  WHEN
                    unaccent(
                      lower(
                        COALESCE(
                          i.county,
                          ''
                        )
                      )
                    )
                    LIKE
                    '%' ||
                    unaccent(
                      lower(${term})
                    ) ||
                    '%'
                  THEN 1.0
                  ELSE 0.0
                END,

                CASE
                  WHEN
                    char_length(${term}) >= 4
                  THEN
                    word_similarity(
                      unaccent(
                        lower(${term})
                      ),
                      unaccent(
                        lower(
                          COALESCE(
                            i.county,
                            ''
                          )
                        )
                      )
                    )
                  ELSE 0.0
                END,

                /*
                 * =========================
                 * PROVINCIA
                 * =========================
                 */

                CASE
                  WHEN
                    unaccent(
                      lower(
                        COALESCE(
                          i.province,
                          ''
                        )
                      )
                    )
                    LIKE
                    '%' ||
                    unaccent(
                      lower(${term})
                    ) ||
                    '%'
                  THEN 1.0
                  ELSE 0.0
                END,

                CASE
                  WHEN
                    char_length(${term}) >= 4
                  THEN
                    word_similarity(
                      unaccent(
                        lower(${term})
                      ),
                      unaccent(
                        lower(
                          COALESCE(
                            i.province,
                            ''
                          )
                        )
                      )
                    )
                  ELSE 0.0
                END,

                /*
                 * =========================
                 * GRUPO TITULACIÓN
                 * =========================
                 */

                CASE
                  WHEN
                    unaccent(
                      lower(
                        COALESCE(
                          sp."qualificationGroup",
                          ''
                        )
                      )
                    )
                    LIKE
                    '%' ||
                    unaccent(
                      lower(${term})
                    ) ||
                    '%'
                  THEN 0.8
                  ELSE 0.0
                END,

                CASE
                  WHEN
                    char_length(${term}) >= 4
                  THEN
                    word_similarity(
                      unaccent(
                        lower(${term})
                      ),
                      unaccent(
                        lower(
                          COALESCE(
                            sp."qualificationGroup",
                            ''
                          )
                        )
                      )
                    ) * 0.7
                  ELSE 0.0
                END

              )::double precision
                AS score

            FROM
              "selection_processes" sp

            LEFT JOIN
              "institutions" i
                ON
                  i.id =
                  sp."institutionId"

            WHERE
              sp."sourceActive" = true
          )

          SELECT
            id,
            score

          FROM
            scored

          WHERE
            score >= 0.55

          ORDER BY
            score DESC,
            id ASC
        `;

      /*
       * Resultado de esta palabra.
       */
      const termScores =
        new Map<number, number>();

      for (const row of rows) {
        termScores.set(
          row.id,
          Number(row.score),
        );
      }

      /*
       * Primera palabra:
       *
       * guardamos todas las coincidencias.
       */
      if (
        accumulatedScores ===
        undefined
      ) {
        accumulatedScores =
          termScores;

        continue;
      }

      /*
       * Segunda palabra y siguientes:
       *
       * hacemos intersección.
       *
       * La convocatoria debe cumplir
       * TODAS las palabras.
       */
      const intersection =
        new Map<
          number,
          number
        >();

      for (const [
        id,
        currentScore,
      ] of accumulatedScores) {
        const newScore =
          termScores.get(id);

        if (
          newScore === undefined
        ) {
          continue;
        }

        /*
         * Sumamos la relevancia
         * de todas las palabras.
         */
        intersection.set(
          id,
          currentScore +
            newScore,
        );
      }

      accumulatedScores =
        intersection;

      /*
       * Si ya no queda ninguna
       * coincidencia, podemos terminar.
       */
      if (
        accumulatedScores.size ===
        0
      ) {
        return [];
      }
    }

    if (!accumulatedScores) {
      return [];
    }

    /*
     * Mayor puntuación primero.
     */
    return [
      ...accumulatedScores.entries(),
    ]
      .map(
        ([id, score]) => ({
          id,
          score,
        }),
      )
      .sort((a, b) => {
        if (
          b.score !== a.score
        ) {
          return (
            b.score -
            a.score
          );
        }

        return a.id - b.id;
      });
  }

  /*
   * ========================================
   * OPCIONES DE FILTROS
   * ========================================
   */
  async getFilterOptions(): Promise<SelectionProcessFilterOptions> {
    const [
      institutions,
      statuses,
      scopes,
      selectionSystems,
      personnelTypes,
      qualificationGroups,
    ] = await Promise.all([
      /*
       * Instituciones que tienen alguna
       * convocatoria activa.
       */
      this.prisma.institution.findMany({
        where: {
          selectionProcesses: {
            some: {
              sourceActive: true,
            },
          },
        },

        select: {
          municipality: true,
          county: true,
          province: true,
        },
      }),

      /*
       * Estados
       */
      this.prisma.selectionProcess.findMany(
        {
          where: {
            sourceActive: true,
          },

          select: {
            statusId: true,
            status: true,
          },

          distinct: [
            "statusId",
          ],
        },
      ),

      /*
       * Ámbitos
       */
      this.prisma.selectionProcess.findMany(
        {
          where: {
            sourceActive: true,
          },

          select: {
            scopeId: true,
            scopeName: true,
          },

          distinct: [
            "scopeId",
          ],
        },
      ),

      /*
       * Sistemas de selección
       */
      this.prisma.selectionProcess.findMany(
        {
          where: {
            sourceActive: true,

            selectionSystemId: {
              not: null,
            },

            selectionSystem: {
              not: null,
            },
          },

          select: {
            selectionSystemId:
              true,

            selectionSystem:
              true,
          },

          distinct: [
            "selectionSystemId",
          ],
        },
      ),

      /*
       * Tipos de personal
       */
      this.prisma.selectionProcess.findMany(
        {
          where: {
            sourceActive: true,

            personnelTypeId: {
              not: null,
            },

            personnelType: {
              not: null,
            },
          },

          select: {
            personnelTypeId:
              true,

            personnelType:
              true,
          },

          distinct: [
            "personnelTypeId",
          ],
        },
      ),

      /*
       * Grupos de titulación
       */
      this.prisma.selectionProcess.findMany(
        {
          where: {
            sourceActive: true,

            qualificationGroup: {
              not: null,
            },
          },

          select: {
            qualificationGroup:
              true,
          },

          distinct: [
            "qualificationGroup",
          ],
        },
      ),
    ]);

    /*
     * --------------------------------
     * TERRITORIO
     * --------------------------------
     */
    const municipalities =
      uniqueSortedStrings(
        institutions.map(
          (institution) =>
            institution.municipality,
        ),
      );

    const counties =
      uniqueSortedStrings(
        institutions.map(
          (institution) =>
            institution.county,
        ),
      );

    const provinces =
      uniqueSortedStrings(
        institutions.map(
          (institution) =>
            institution.province,
        ),
      );

    /*
     * Relación:
     *
     * Provincia
     *   -> Comarca
     *       -> Municipio
     */
    const territories =
      buildTerritories(
        institutions,
      );

    /*
     * --------------------------------
     * SISTEMAS DE SELECCIÓN
     * --------------------------------
     */
    const normalizedSelectionSystems =
      selectionSystems
        .flatMap((item) => {
          if (
            item.selectionSystemId ===
              null ||
            item.selectionSystem ===
              null
          ) {
            return [];
          }

          return [
            {
              id:
                item.selectionSystemId,

              name:
                item.selectionSystem,
            },
          ];
        })
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ca",
          ),
        );

    /*
     * --------------------------------
     * TIPOS DE PERSONAL
     * --------------------------------
     */
    const normalizedPersonnelTypes =
      personnelTypes
        .flatMap((item) => {
          if (
            item.personnelTypeId ===
              null ||
            item.personnelType ===
              null
          ) {
            return [];
          }

          return [
            {
              id:
                item.personnelTypeId,

              name:
                item.personnelType,
            },
          ];
        })
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ca",
          ),
        );

    return {
      municipalities,
      counties,
      provinces,
      territories,

      statuses: statuses
        .map((item) => ({
          id: item.statusId,
          name: item.status,
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ca",
          ),
        ),

      scopes: scopes
        .map((item) => ({
          id: item.scopeId,
          name: item.scopeName,
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ca",
          ),
        ),

      selectionSystems:
        normalizedSelectionSystems,

      personnelTypes:
        normalizedPersonnelTypes,

      qualificationGroups:
        uniqueSortedStrings(
          qualificationGroups.map(
            (item) =>
              item.qualificationGroup,
          ),
        ),
    };
  }
}

/*
 * ========================================
 * MAPEO RESULTADO -> APPLICATION
 * ========================================
 */
function mapSelectionProcessListItem(
  row: SelectionProcessWithInstitution,
) {
  return {
    id: row.id,

    cidoIdentifier:
      row.cidoIdentifier,

    title: row.title,

    isJobPool:
      row.isJobPool,

    applicationEndDate:
      row.applicationEndDate,

    qualificationGroup:
      row.qualificationGroup,

    status:
      row.status,

    cidoUrl:
      row.cidoUrl,

    institution:
      row.institution
        ? {
            name:
              row.institution.name,

            municipality:
              row.institution
                .municipality,

            county:
              row.institution.county,

            province:
              row.institution.province,
          }
        : null,
  };
}

/*
 * ========================================
 * STRINGS ÚNICOS Y ORDENADOS
 * ========================================
 */
function uniqueSortedStrings(
  values: Array<
    string | null
  >,
): string[] {
  return [
    ...new Set(
      values
        .map((value) =>
          value?.trim(),
        )
        .filter(
          (
            value,
          ): value is string =>
            value !== undefined &&
            value.length > 0,
        ),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "ca",
    ),
  );
}

/*
 * ========================================
 * JERARQUÍA TERRITORIAL
 * ========================================
 */
function buildTerritories(
  institutions: Array<{
    province:
      | string
      | null;

    county:
      | string
      | null;

    municipality:
      | string
      | null;
  }>,
): SelectionProcessTerritoryOption[] {
  const territories =
    new Map<
      string,
      SelectionProcessTerritoryOption
    >();

  for (const institution of institutions) {
    const province =
      institution.province?.trim();

    /*
     * Para construir la jerarquía
     * territorial necesitamos provincia.
     */
    if (!province) {
      continue;
    }

    const county =
      institution.county?.trim() ||
      null;

    const municipality =
      institution.municipality?.trim() ||
      null;

    const territory:
      SelectionProcessTerritoryOption =
      {
        province,
        county,
        municipality,
      };

    /*
     * Evitamos duplicados.
     */
    const key = [
      province,
      county ?? "",
      municipality ?? "",
    ].join("|");

    territories.set(
      key,
      territory,
    );
  }

  return [
    ...territories.values(),
  ].sort((a, b) => {
    /*
     * Provincia
     */
    const provinceComparison =
      a.province.localeCompare(
        b.province,
        "ca",
      );

    if (
      provinceComparison !== 0
    ) {
      return provinceComparison;
    }

    /*
     * Comarca
     */
    const countyComparison =
      (
        a.county ?? ""
      ).localeCompare(
        b.county ?? "",
        "ca",
      );

    if (
      countyComparison !== 0
    ) {
      return countyComparison;
    }

    /*
     * Municipio
     */
    return (
      a.municipality ?? ""
    ).localeCompare(
      b.municipality ?? "",
      "ca",
    );
  });
}