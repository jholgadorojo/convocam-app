import type {
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";

import type { SelectionProcessPage } from "../../application/selection-process-page";
import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "../../application/selection-process-search-filters";
import type {
  SelectionProcessFilterOptions,
  SelectionProcessTerritoryOption,
} from "../../application/selection-process-filter-options";

type TextSearchRow = {
  id: number;
};

function uniqueSortedStrings(
  values: Array<string | null>,
): string[] {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter(
          (value): value is string =>
            value !== undefined &&
            value.length > 0,
        ),
    ),
  ].sort((a, b) =>
    a.localeCompare(b, "ca"),
  );
}

function buildTerritories(
  institutions: Array<{
    province: string | null;
    county: string | null;
    municipality: string | null;
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

    if (!province) {
      continue;
    }

    const county =
      institution.county?.trim() || null;

    const municipality =
      institution.municipality?.trim() ||
      null;

    const territory = {
      province,
      county,
      municipality,
    };

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
    const provinceComparison =
      a.province.localeCompare(
        b.province,
        "ca",
      );

    if (provinceComparison !== 0) {
      return provinceComparison;
    }

    const countyComparison =
      (a.county ?? "").localeCompare(
        b.county ?? "",
        "ca",
      );

    if (countyComparison !== 0) {
      return countyComparison;
    }

    return (
      a.municipality ?? ""
    ).localeCompare(
      b.municipality ?? "",
      "ca",
    );
  });
}

export class PrismaSelectionProcessQueryRepository
  implements SelectionProcessQueryRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findActive(
    page: number,
    pageSize: number,
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessPage> {
    const skip = (page - 1) * pageSize;

    const text = filters.text?.trim();
    const municipality = filters.municipality?.trim();
    const county = filters.county?.trim();
    const province = filters.province?.trim();
    const qualificationGroups =
      filters.qualificationGroup === undefined
        ? []
        : Array.isArray(filters.qualificationGroup)
          ? filters.qualificationGroup
            .map((group) => group.trim())
            .filter(Boolean)
          : [filters.qualificationGroup.trim()].filter(Boolean);

    const conditions: Prisma.SelectionProcessWhereInput[] = [
      {
        sourceActive: true,
      },
    ];

    if (text) {
  const matchingIds =
    await this.findTextMatchingIds(
      text,
    );

  if (matchingIds.length === 0) {
    return {
      items: [],
      page,
      pageSize,
      totalItems: 0,
      totalPages: 0,
    };
  }

  conditions.push({
    id: {
      in: matchingIds,
    },
  });
}
    const institutionConditions: Prisma.InstitutionWhereInput = {};

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
      institutionConditions.municipality = {
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

    if (filters.statusId !== undefined) {
      conditions.push({
        statusId: filters.statusId,
      });
    }

    if (filters.scopeId !== undefined) {
      conditions.push({
        scopeId: filters.scopeId,
      });
    }

    if (filters.selectionSystemId !== undefined) {
      conditions.push({
        selectionSystemId: filters.selectionSystemId,
      });
    }

    if (filters.personnelTypeId !== undefined) {
      conditions.push({
        personnelTypeId: filters.personnelTypeId,
      });
    }

    if (qualificationGroups.length > 0) {
      conditions.push({
        qualificationGroup: {
          in: qualificationGroups,
        },
      });
    }

    if (filters.isJobPool !== undefined) {
      conditions.push({
        isJobPool: filters.isJobPool,
      });
    }

    if (
      filters.applicationEndDateFrom ||
      filters.applicationEndDateTo
    ) {
      conditions.push({
        applicationEndDate: {
          ...(filters.applicationEndDateFrom
            ? {
              gte: filters.applicationEndDateFrom,
            }
            : {}),

          ...(filters.applicationEndDateTo
            ? {
              lte: filters.applicationEndDateTo,
            }
            : {}),
        },
      });
    }

    if (filters.reservedDisability !== undefined) {
      conditions.push({
        reservedDisabilityPositions:
          filters.reservedDisability
            ? {
              gt: 0,
            }
            : {
              equals: 0,
            },
      });
    }

    if (filters.reservedUnemployed !== undefined) {
      conditions.push({
        reservedUnemployed:
          filters.reservedUnemployed,
      });
    }

    if (filters.reservedYoung !== undefined) {
      conditions.push({
        reservedYoung:
          filters.reservedYoung,
      });
    }

    if (filters.reservedWomen !== undefined) {
      conditions.push({
        reservedWomen:
          filters.reservedWomen,
      });
    }

    const where: Prisma.SelectionProcessWhereInput = {
      AND: conditions,
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.selectionProcess.findMany({
        where,

        select: {
          id: true,
          cidoIdentifier: true,
          title: true,
          isJobPool: true,
          applicationEndDate: true,
          qualificationGroup: true,
          status: true,
          cidoUrl: true,

          institution: {
            select: {
              name: true,
              municipality: true,
              county: true,
              province: true,
            },
          },
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
      }),

      this.prisma.selectionProcess.count({
        where,
      }),
    ]);

    return {
      items,
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(
        totalItems / pageSize,
      ),
    };
  }

  private async findTextMatchingIds(
  text: string,
): Promise<number[]> {
  /*
   * Separamos la búsqueda en palabras.
   *
   * "cardedeu informatic"
   *
   * se convierte en:
   *
   * ["cardedeu", "informatic"]
   */
  const terms = [
    ...new Set(
      text
        .trim()
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ];

  if (terms.length === 0) {
    return [];
  }

  let matchingIds:
    | Set<number>
    | undefined;

  for (const term of terms) {
    const rows =
      await this.prisma.$queryRaw<
        TextSearchRow[]
      >`
        SELECT
          sp.id
        FROM
          "selection_processes" sp
        LEFT JOIN
          "institutions" i
            ON i.id = sp."institutionId"
        WHERE
          sp."sourceActive" = true
          AND
          (
            /*
             * Coincidencia normal,
             * ignorando acentos.
             */

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

            OR

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

            OR

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

            OR

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

            OR

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

            OR

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

            /*
             * Si la palabra tiene al menos
             * 4 caracteres, permitimos
             * coincidencia aproximada.
             */

            OR
            (
              char_length(${term}) >= 4

              AND
              (
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
                ) >= 0.55

                OR

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
                ) >= 0.55

                OR

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
                ) >= 0.55

                OR

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
                ) >= 0.55

                OR

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
                ) >= 0.55

                OR

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
                ) >= 0.55
              )
            )
          )
      `;

    const termIds = new Set(
      rows.map((row) => row.id),
    );

    /*
     * Primera palabra:
     * guardamos todos sus resultados.
     */
    if (matchingIds === undefined) {
      matchingIds = termIds;
      continue;
    }

    /*
     * Siguientes palabras:
     *
     * hacemos una intersección.
     *
     * Es decir:
     *
     * "cardedeu informatic"
     *
     * debe cumplir:
     *
     * cardedeu
     * AND
     * informatic
     */
    matchingIds = new Set(
      [...matchingIds].filter(
        (id) => termIds.has(id),
      ),
    );

    if (matchingIds.size === 0) {
      return [];
    }
  }

  return matchingIds
    ? [...matchingIds]
    : [];
}

  async getFilterOptions(): Promise<SelectionProcessFilterOptions> {
    const [
      institutions,
      statuses,
      scopes,
      selectionSystems,
      personnelTypes,
      qualificationGroups,
    ] = await Promise.all([
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

      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
        },
        select: {
          statusId: true,
          status: true,
        },
        distinct: ["statusId"],
      }),

      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
        },
        select: {
          scopeId: true,
          scopeName: true,
        },
        distinct: ["scopeId"],
      }),

      this.prisma.selectionProcess.findMany({
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
          selectionSystemId: true,
          selectionSystem: true,
        },
        distinct: ["selectionSystemId"],
      }),

      this.prisma.selectionProcess.findMany({
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
          personnelTypeId: true,
          personnelType: true,
        },
        distinct: ["personnelTypeId"],
      }),

      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
          qualificationGroup: {
            not: null,
          },
        },
        select: {
          qualificationGroup: true,
        },
        distinct: ["qualificationGroup"],
      }),
    ]);

    const municipalities = uniqueSortedStrings(
      institutions.map(
        (institution) => institution.municipality,
      ),
    );

    const counties = uniqueSortedStrings(
      institutions.map(
        (institution) => institution.county,
      ),
    );

    const provinces = uniqueSortedStrings(
      institutions.map(
        (institution) => institution.province,
      ),
    );

    const territories =
      buildTerritories(institutions);

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
          a.name.localeCompare(b.name, "ca"),
        ),

      scopes: scopes
        .map((item) => ({
          id: item.scopeId,
          name: item.scopeName,
        }))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "ca"),
        ),

      selectionSystems: selectionSystems
        .filter(
          (
            item,
          ): item is {
            selectionSystemId: number;
            selectionSystem: string;
          } =>
            item.selectionSystemId !== null &&
            item.selectionSystem !== null,
        )
        .map((item) => ({
          id: item.selectionSystemId,
          name: item.selectionSystem,
        }))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "ca"),
        ),

      personnelTypes: personnelTypes
        .filter(
          (
            item,
          ): item is {
            personnelTypeId: number;
            personnelType: string;
          } =>
            item.personnelTypeId !== null &&
            item.personnelType !== null,
        )
        .map((item) => ({
          id: item.personnelTypeId,
          name: item.personnelType,
        }))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "ca"),
        ),

      qualificationGroups: uniqueSortedStrings(
        qualificationGroups.map(
          (item) => item.qualificationGroup,
        ),
      ),
    };
  }
}