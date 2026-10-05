import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import type {
  SelectionProcessFilterOptions,
  SelectionProcessTerritoryOption,
} from "../../application/selection-process-filter-options";

import type { SelectionProcessListItem } from "../../application/selection-process-list-item";

import type { SelectionProcessPage } from "../../application/selection-process-page";

import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";

import type { SelectionProcessSearchFilters } from "../../application/selection-process-search-filters";

type SelectionProcessRow =
  Prisma.SelectionProcessGetPayload<{
    include: {
      institution: true;
    };
  }>;

type TextSearchMatch = {
  id: number;
  score: number;
};

type InstitutionTerritoryRow = {
  municipality: string | null;
  county: string | null;
  province: string | null;
};

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

    /*
     * Normalizamos qualificationGroup.
     *
     * El contrato permite:
     *
     * string
     * string[]
     *
     * Prisma "in" necesita siempre
     * un array.
     */
    const qualificationGroups =
      normalizeStringArray(
        filters.qualificationGroup,
      );

    /*
     * Si existe texto de búsqueda,
     * primero utilizamos PostgreSQL
     * para obtener coincidencias
     * tolerantes y su puntuación.
     */
    const textMatches =
      filters.text
        ? await this.findTextMatches(
            filters.text,
          )
        : null;

    /*
     * Si existe búsqueda textual
     * pero no hay ninguna coincidencia,
     * devolvemos directamente vacío.
     */
    if (
      textMatches !== null &&
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

    const conditions:
      Prisma.SelectionProcessWhereInput[] =
      [
        {
          sourceActive: true,
        },
      ];

    /*
     * Búsqueda textual.
     */
    if (
      textMatches !== null
    ) {
      conditions.push({
        id: {
          in: textMatches.map(
            (match) =>
              match.id,
          ),
        },
      });
    }

    /*
     * Grupo de titulación.
     */
    if (
      qualificationGroups.length >
      0
    ) {
      conditions.push({
        qualificationGroup: {
          in:
            qualificationGroups,
        },
      });
    }

    /*
     * Plaza / bolsa.
     */
    if (
      filters.isJobPool !==
      undefined
    ) {
      conditions.push({
        isJobPool:
          filters.isJobPool,
      });
    }

    /*
     * Estado.
     */
    if (
      filters.statusId !==
      undefined
    ) {
      conditions.push({
        statusId:
          filters.statusId,
      });
    }

    /*
     * Provincia, comarca
     * y municipio.
     */
    if (
      filters.province ||
      filters.county ||
      filters.municipality
    ) {
      conditions.push({
        institution: {
          is: {
            ...(filters.province
              ? {
                  province:
                    filters.province,
                }
              : {}),

            ...(filters.county
              ? {
                  county:
                    filters.county,
                }
              : {}),

            ...(filters.municipality
              ? {
                  municipality:
                    filters.municipality,
                }
              : {}),
          },
        },
      });
    }

    /*
     * Ámbito.
     */
    if (
      filters.scopeId !==
      undefined
    ) {
      conditions.push({
        scopeId:
          filters.scopeId,
      });
    }

    /*
     * Sistema de selección.
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
     * Tipo de personal.
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
     * Fecha límite desde.
     */
    if (
      filters.applicationEndDateFrom
    ) {
      conditions.push({
        applicationEndDate: {
          gte:
            filters.applicationEndDateFrom,
        },
      });
    }

    /*
     * Fecha límite hasta.
     */
    if (
      filters.applicationEndDateTo
    ) {
      conditions.push({
        applicationEndDate: {
          lte:
            filters.applicationEndDateTo,
        },
      });
    }

    /*
     * Reserva discapacidad.
     */
    if (
      filters.reservedDisability
    ) {
      conditions.push({
        reservedDisabilityPositions:
          {
            gt: 0,
          },
      });
    }

    /*
     * Reserva desempleados.
     */
    if (
      filters.reservedUnemployed
    ) {
      conditions.push({
        reservedUnemployed:
          true,
      });
    }

    /*
     * Reserva jóvenes.
     */
    if (
      filters.reservedYoung
    ) {
      conditions.push({
        reservedYoung:
          true,
      });
    }

    /*
     * Reserva mujeres.
     */
    if (
      filters.reservedWomen
    ) {
      conditions.push({
        reservedWomen:
          true,
      });
    }

    const where:
      Prisma.SelectionProcessWhereInput =
      {
        AND: conditions,
      };

    /*
     * CON TEXTO:
     *
     * Tenemos que mantener el orden
     * calculado por la búsqueda
     * tolerante.
     */
    if (
      textMatches !== null
    ) {
      const [
        rows,
        totalItems,
      ] =
        await Promise.all([
          this.prisma.selectionProcess.findMany(
            {
              where,

              include: {
                institution:
                  true,
              },
            },
          ),

          this.prisma.selectionProcess.count(
            {
              where,
            },
          ),
        ]);

      /*
       * textMatches ya viene
       * ordenado por relevancia.
       */
      const relevanceOrder =
        new Map<
          number,
          number
        >();

      textMatches.forEach(
        (
          match,
          index,
        ) => {
          relevanceOrder.set(
            match.id,
            index,
          );
        },
      );

      rows.sort(
        (
          first,
          second,
        ) => {
          const firstOrder =
            relevanceOrder.get(
              first.id,
            ) ??
            Number.MAX_SAFE_INTEGER;

          const secondOrder =
            relevanceOrder.get(
              second.id,
            ) ??
            Number.MAX_SAFE_INTEGER;

          return (
            firstOrder -
            secondOrder
          );
        },
      );

      const paginatedRows =
        rows.slice(
          skip,
          skip +
            pageSize,
        );

      return {
        items:
          paginatedRows.map(
            (
              row,
            ) =>
              mapSelectionProcessListItem(
                row,
              ),
          ),

        page,

        pageSize,

        totalItems,

        totalPages:
          Math.ceil(
            totalItems /
              pageSize,
          ),
      };
    }

    /*
     * SIN TEXTO:
     *
     * Orden normal por fecha límite.
     */
    const [
      rows,
      totalItems,
    ] =
      await Promise.all([
        this.prisma.selectionProcess.findMany(
          {
            where,

            include: {
              institution:
                true,
            },

            orderBy: [
              {
                applicationEndDate:
                  {
                    sort:
                      "asc",

                    nulls:
                      "last",
                  },
              },

              {
                id:
                  "asc",
              },
            ],

            skip,

            take:
              pageSize,
          },
        ),

        this.prisma.selectionProcess.count(
          {
            where,
          },
        ),
      ]);

    return {
      items:
        rows.map(
          (
            row,
          ) =>
            mapSelectionProcessListItem(
              row,
            ),
        ),

      page,

      pageSize,

      totalItems,

      totalPages:
        Math.ceil(
          totalItems /
            pageSize,
        ),
    };
  }

  /*
   * Opciones disponibles para
   * construir los filtros.
   */
  async getFilterOptions(): Promise<SelectionProcessFilterOptions> {
    const [
      institutionRows,
      statuses,
      scopes,
      selectionSystems,
      personnelTypes,
      qualificationGroups,
    ] =
      await Promise.all([
        /*
         * Territorio.
         */
        this.prisma.selectionProcess.findMany(
          {
            where: {
              sourceActive:
                true,

              institutionId: {
                not:
                  null,
              },
            },

            select: {
              institution: {
                select: {
                  municipality:
                    true,

                  county:
                    true,

                  province:
                    true,
                },
              },
            },
          },
        ),

        /*
         * Estados.
         */
        this.prisma.selectionProcess.findMany(
          {
            where: {
              sourceActive:
                true,
            },

            select: {
              statusId:
                true,

              status:
                true,
            },

            distinct: [
              "statusId",
              "status",
            ],
          },
        ),

        /*
         * Ámbitos.
         */
        this.prisma.selectionProcess.findMany(
          {
            where: {
              sourceActive:
                true,
            },

            select: {
              scopeId:
                true,

              scopeName:
                true,
            },

            distinct: [
              "scopeId",
              "scopeName",
            ],
          },
        ),

        /*
         * Sistemas de selección.
         */
        this.prisma.selectionProcess.findMany(
          {
            where: {
              sourceActive:
                true,

              selectionSystemId:
                {
                  not:
                    null,
                },

              selectionSystem:
                {
                  not:
                    null,
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
              "selectionSystem",
            ],
          },
        ),

        /*
         * Tipos de personal.
         */
        this.prisma.selectionProcess.findMany(
          {
            where: {
              sourceActive:
                true,

              personnelTypeId:
                {
                  not:
                    null,
                },

              personnelType:
                {
                  not:
                    null,
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
              "personnelType",
            ],
          },
        ),

        /*
         * Grupos de titulación.
         */
        this.prisma.selectionProcess.findMany(
          {
            where: {
              sourceActive:
                true,

              qualificationGroup:
                {
                  not:
                    null,
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

    const institutions:
      InstitutionTerritoryRow[] =
      institutionRows
        .map(
          (
            row,
          ) =>
            row.institution,
        )
        .filter(
          (
            institution,
          ): institution is InstitutionTerritoryRow =>
            institution !==
            null,
        );

    const municipalities =
      uniqueSortedStrings(
        institutions.map(
          (
            institution,
          ) =>
            institution.municipality,
        ),
      );

    const counties =
      uniqueSortedStrings(
        institutions.map(
          (
            institution,
          ) =>
            institution.county,
        ),
      );

    const provinces =
      uniqueSortedStrings(
        institutions.map(
          (
            institution,
          ) =>
            institution.province,
        ),
      );

    const territories =
      buildTerritories(
        institutions,
      );

    return {
      municipalities,

      counties,

      provinces,

      territories,

      statuses:
        statuses
          .map(
            (
              status,
            ) => ({
              id:
                status.statusId,

              name:
                status.status,
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
                "ca",
              ),
          ),

      scopes:
        scopes
          .map(
            (
              scope,
            ) => ({
              id:
                scope.scopeId,

              name:
                scope.scopeName,
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
                "ca",
              ),
          ),

      selectionSystems:
        selectionSystems
          .filter(
            (
              option,
            ) =>
              option.selectionSystemId !==
                null &&
              option.selectionSystem !==
                null,
          )
          .map(
            (
              option,
            ) => ({
              id:
                option.selectionSystemId!,

              name:
                option.selectionSystem!,
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
                "ca",
              ),
          ),

      personnelTypes:
        personnelTypes
          .filter(
            (
              option,
            ) =>
              option.personnelTypeId !==
                null &&
              option.personnelType !==
                null,
          )
          .map(
            (
              option,
            ) => ({
              id:
                option.personnelTypeId!,

              name:
                option.personnelType!,
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
                "ca",
              ),
          ),

      qualificationGroups:
        uniqueSortedStrings(
          qualificationGroups.map(
            (
              option,
            ) =>
              option.qualificationGroup,
          ),
        ),
    };
  }

  /*
   * Búsqueda tolerante.
   */
  private async findTextMatches(
    text: string,
  ): Promise<
    TextSearchMatch[]
  > {
    const terms =
      text
        .trim()
        .split(/\s+/)
        .map(
          (
            term,
          ) =>
            term.trim(),
        )
        .filter(Boolean);

    if (
      terms.length ===
      0
    ) {
      return [];
    }

    /*
     * Cada palabra escrita debe
     * coincidir en alguno de los
     * campos relevantes.
     */
    const matchConditions =
      terms.map(
        (
          term,
        ) => {
          const contains =
            `%${term}%`;

          return Prisma.sql`
            (
              unaccent(
                lower(
                  coalesce(
                    sp.title,
                    ''
                  )
                )
              )
                LIKE
              unaccent(
                lower(
                  ${contains}
                )
              )

              OR

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      sp.title,
                      ''
                    )
                  )
                )
              ) >= 0.55

              OR

              unaccent(
                lower(
                  coalesce(
                    i.name,
                    ''
                  )
                )
              )
                LIKE
              unaccent(
                lower(
                  ${contains}
                )
              )

              OR

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      i.name,
                      ''
                    )
                  )
                )
              ) >= 0.55

              OR

              unaccent(
                lower(
                  coalesce(
                    i.municipality,
                    ''
                  )
                )
              )
                LIKE
              unaccent(
                lower(
                  ${contains}
                )
              )

              OR

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      i.municipality,
                      ''
                    )
                  )
                )
              ) >= 0.55

              OR

              unaccent(
                lower(
                  coalesce(
                    i.county,
                    ''
                  )
                )
              )
                LIKE
              unaccent(
                lower(
                  ${contains}
                )
              )

              OR

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      i.county,
                      ''
                    )
                  )
                )
              ) >= 0.55

              OR

              unaccent(
                lower(
                  coalesce(
                    i.province,
                    ''
                  )
                )
              )
                LIKE
              unaccent(
                lower(
                  ${contains}
                )
              )

              OR

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      i.province,
                      ''
                    )
                  )
                )
              ) >= 0.55

              OR

              unaccent(
                lower(
                  coalesce(
                    sp."qualificationGroup",
                    ''
                  )
                )
              )
                LIKE
              unaccent(
                lower(
                  ${contains}
                )
              )

              OR

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      sp."qualificationGroup",
                      ''
                    )
                  )
                )
              ) >= 0.55
            )
          `;
        },
      );

    /*
     * Puntuación:
     *
     * título
     * organismo
     * territorio
     * grupo
     */
    const scoreExpressions =
      terms.map(
        (
          term,
        ) => {
          const contains =
            `%${term}%`;

          return Prisma.sql`
            GREATEST(
              CASE
                WHEN
                  unaccent(
                    lower(
                      coalesce(
                        sp.title,
                        ''
                      )
                    )
                  )
                    LIKE
                  unaccent(
                    lower(
                      ${contains}
                    )
                  )
                THEN 2.0
                ELSE 0.0
              END,

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      sp.title,
                      ''
                    )
                  )
                )
              ) * 1.5,

              CASE
                WHEN
                  unaccent(
                    lower(
                      coalesce(
                        i.name,
                        ''
                      )
                    )
                  )
                    LIKE
                  unaccent(
                    lower(
                      ${contains}
                    )
                  )
                THEN 1.4
                ELSE 0.0
              END,

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      i.name,
                      ''
                    )
                  )
                )
              ) * 1.1,

              CASE
                WHEN
                  unaccent(
                    lower(
                      coalesce(
                        i.municipality,
                        ''
                      )
                    )
                  )
                    LIKE
                  unaccent(
                    lower(
                      ${contains}
                    )
                  )

                  OR

                  unaccent(
                    lower(
                      coalesce(
                        i.county,
                        ''
                      )
                    )
                  )
                    LIKE
                  unaccent(
                    lower(
                      ${contains}
                    )
                  )

                  OR

                  unaccent(
                    lower(
                      coalesce(
                        i.province,
                        ''
                      )
                    )
                  )
                    LIKE
                  unaccent(
                    lower(
                      ${contains}
                    )
                  )

                THEN 1.0
                ELSE 0.0
              END,

              GREATEST(
                word_similarity(
                  unaccent(
                    lower(
                      ${term}
                    )
                  ),
                  unaccent(
                    lower(
                      coalesce(
                        i.municipality,
                        ''
                      )
                    )
                  )
                ),

                word_similarity(
                  unaccent(
                    lower(
                      ${term}
                    )
                  ),
                  unaccent(
                    lower(
                      coalesce(
                        i.county,
                        ''
                      )
                    )
                  )
                ),

                word_similarity(
                  unaccent(
                    lower(
                      ${term}
                    )
                  ),
                  unaccent(
                    lower(
                      coalesce(
                        i.province,
                        ''
                      )
                    )
                  )
                )
              ) * 1.0,

              CASE
                WHEN
                  unaccent(
                    lower(
                      coalesce(
                        sp."qualificationGroup",
                        ''
                      )
                    )
                  )
                    LIKE
                  unaccent(
                    lower(
                      ${contains}
                    )
                  )
                THEN 0.8
                ELSE 0.0
              END,

              word_similarity(
                unaccent(
                  lower(
                    ${term}
                  )
                ),
                unaccent(
                  lower(
                    coalesce(
                      sp."qualificationGroup",
                      ''
                    )
                  )
                )
              ) * 0.7
            )
          `;
        },
      );

    return this.prisma.$queryRaw<
      TextSearchMatch[]
    >(
      Prisma.sql`
        SELECT
          sp.id,

          (
            ${Prisma.join(
              scoreExpressions,
              " + ",
            )}
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

          AND

          ${Prisma.join(
            matchConditions,
            " AND ",
          )}

        ORDER BY
          score DESC,
          sp.id ASC
      `,
    );
  }
}

/*
 * Prisma -> Application.
 */
function mapSelectionProcessListItem(
  row: SelectionProcessRow,
): SelectionProcessListItem {
  return {
    id:
      row.id,

    cidoIdentifier:
      row.cidoIdentifier,

    title:
      row.title,

    isJobPool:
      row.isJobPool,

    /*
     * Estado oficial.
     */
    statusId:
      row.statusId,

    status:
      row.status,

    /*
     * Periodo de solicitud.
     */
    applicationStartDate:
      row.applicationStartDate,

    applicationEndDate:
      row.applicationEndDate,

    /*
     * Información resumida.
     */
    numberOfPositions:
      row.numberOfPositions,

    qualificationGroup:
      row.qualificationGroup,

    personnelType:
      row.personnelType,

    selectionSystem:
      row.selectionSystem,

    /*
     * Prisma:
     *
     * scopeName
     *
     * Application:
     *
     * scope
     */
    scope:
      row.scopeName,

    /*
     * Reservas.
     */
    reservedPlaces: {
      disability:
        row.reservedDisabilityPositions,

      unemployed:
        row.reservedUnemployed,

      youngPeople:
        row.reservedYoung,

      women:
        row.reservedWomen,
    },

    /*
     * Fuente.
     */
    cidoUrl:
      row.cidoUrl,

    /*
     * Institución.
     */
    institution:
      row.institution
        ? {
            name:
              row.institution
                .name,

            municipality:
              row.institution
                .municipality,

            county:
              row.institution
                .county,

            province:
              row.institution
                .province,
          }
        : null,
  };
}

/*
 * Normaliza:
 *
 * string
 *
 * o
 *
 * string[]
 *
 * a:
 *
 * string[]
 */
function normalizeStringArray(
  value:
    | string
    | string[]
    | undefined,
): string[] {
  if (
    value === undefined
  ) {
    return [];
  }

  const values =
    Array.isArray(
      value,
    )
      ? value
      : [value];

  return [
    ...new Set(
      values
        .map(
          (
            item,
          ) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

/*
 * Elimina null, vacíos y duplicados,
 * y ordena alfabéticamente.
 */
function uniqueSortedStrings(
  values:
    (
      | string
      | null
    )[],
): string[] {
  return [
    ...new Set(
      values
        .map(
          (
            value,
          ) =>
            value?.trim() ??
            "",
        )
        .filter(Boolean),
    ),
  ].sort(
    (
      first,
      second,
    ) =>
      first.localeCompare(
        second,
        "ca",
      ),
  );
}

/*
 * Construye las combinaciones reales:
 *
 * provincia
 * comarca
 * municipio
 */
function buildTerritories(
  institutions:
    InstitutionTerritoryRow[],
): SelectionProcessTerritoryOption[] {
  const territories =
    new Map<
      string,
      SelectionProcessTerritoryOption
    >();

  for (
    const institution of institutions
  ) {
    const province =
      institution.province?.trim();

    if (!province) {
      continue;
    }

    const county =
      institution.county?.trim() ||
      null;

    const municipality =
      institution.municipality?.trim() ||
      null;

    const key =
      [
        province,
        county ?? "",
        municipality ?? "",
      ].join("|");

    if (
      territories.has(
        key,
      )
    ) {
      continue;
    }

    territories.set(
      key,
      {
        province,
        county,
        municipality,
      },
    );
  }

  return [
    ...territories.values(),
  ].sort(
    (
      first,
      second,
    ) => {
      const provinceComparison =
        first.province.localeCompare(
          second.province,
          "ca",
        );

      if (
        provinceComparison !==
        0
      ) {
        return provinceComparison;
      }

      const countyComparison =
        (
          first.county ??
          ""
        ).localeCompare(
          second.county ??
            "",
          "ca",
        );

      if (
        countyComparison !==
        0
      ) {
        return countyComparison;
      }

      return (
        first.municipality ??
        ""
      ).localeCompare(
        second.municipality ??
          "",
        "ca",
      );
    },
  );
}