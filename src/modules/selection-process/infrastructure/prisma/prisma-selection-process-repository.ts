import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessRepository } from "../../application/selection-process-repository";
import type { SelectionProcessSyncData } from "../../application/selection-process-sync-data";

export class PrismaSelectionProcessRepository
  implements SelectionProcessRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

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
        sourceSyncedAt: syncedAt,
      },

      update: {
        ...data,
        institutionId,
        sourceSyncedAt: syncedAt,
      },

      select: {
        id: true,
      },
    });

  return selectionProcess.id;
}
}