import type {
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";

import type { SelectionProcessPage } from "../../application/selection-process-page";
import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "../../application/selection-process-search-filters";

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
    const qualificationGroup =
      filters.qualificationGroup?.trim();

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

    if (qualificationGroup) {
      conditions.push({
        qualificationGroup: {
          equals: qualificationGroup,
          mode: "insensitive",
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
}