import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessRepository } from "../../application/selection-process-repository";
import type { SelectionProcessSyncData } from "../../application/selection-process-sync-data";
import type { SelectionProcessSyncCandidate } from "../../application/selection-process-sync-candidate";

export class PrismaSelectionProcessRepository
  implements SelectionProcessRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) { }

  async upsert(
    data: SelectionProcessSyncData,
    institutionId: number | null,
  ): Promise<number> {
    const syncedAt = new Date();

    const selectionProcess =
      await this.prisma.selectionProcess.upsert({
        where: {
          cidoId: data.cidoId,
        },

        create: {
          ...data,
          institutionId,

          sourceActive: true,
          sourceSyncedAt: syncedAt,
          sourceLastSeenAt: syncedAt,
        },

        update: {
          ...data,
          institutionId,

          sourceActive: true,
          sourceSyncedAt: syncedAt,
          sourceLastSeenAt: syncedAt,
        },

        select: {
          id: true,
        },
      });

    return selectionProcess.id;
  }
  async findActiveNotSeenSince(
  date: Date,
): Promise<SelectionProcessSyncCandidate[]> {
  return this.prisma.selectionProcess.findMany({
    where: {
      sourceActive: true,

      statusId: {
        in: [1, 2, 3],
      },

      sourceLastSeenAt: {
        lt: date,
      },
    },

    select: {
      id: true,
      cidoId: true,
      institutionId: true,
    },
  });
}
async markSourceInactive(
  cidoId: string,
): Promise<void> {
  await this.prisma.selectionProcess.updateMany({
    where: {
      cidoId,
      sourceActive: true,
    },

    data: {
      sourceActive: false,
    },
  });
}
}