import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessPage } from "../../application/selection-process-page";
import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";

export class PrismaSelectionProcessQueryRepository
  implements SelectionProcessQueryRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findActive(
    page: number,
    pageSize: number,
  ): Promise<SelectionProcessPage> {
    const skip = (page - 1) * pageSize;

    const where = {
      sourceActive: true,
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
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }
}