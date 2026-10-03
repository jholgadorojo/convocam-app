import type {
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";

import type { SelectionProcessFilterOptions } from "../../application/selection-process-filter-options";
import type { SelectionProcessPage } from "../../application/selection-process-page";
import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "../../application/selection-process-search-filters";

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

export class PrismaSelectionProcessQueryRepository
  implements SelectionProcessQueryRepository
{
  constructor(private readonly prisma: PrismaClient) {}

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
      conditions.push({
        OR: [
          {
            title: {
              contains: text,
              mode: "insensitive",
            },
          },
          {
            institution: {
              is: {
                name: {
                  contains: text,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            institution: {
              is: {
                municipality: {
                  contains: text,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            institution: {
              is: {
                county: {
                  contains: text,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            institution: {
              is: {
                province: {
                  contains: text,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      });
    }

    if (municipality) {
      conditions.push({
        institution: {
          is: {
            municipality: {
              equals: municipality,
              mode: "insensitive",
            },
          },
        },
      });
    }

    if (county) {
      conditions.push({
        institution: {
          is: {
            county: {
              equals: county,
              mode: "insensitive",
            },
          },
        },
      });
    }

    if (province) {
      conditions.push({
        institution: {
          is: {
            province: {
              equals: province,
              mode: "insensitive",
            },
          },
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

    return {
      municipalities,
      counties,
      provinces,

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