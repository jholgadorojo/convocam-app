import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessDocumentRepository } from "../../application/selection-process-document-repository";
import type { SelectionProcessDocumentSyncData } from "../../application/selection-process-document-sync-data";

export class PrismaSelectionProcessDocumentRepository
  implements SelectionProcessDocumentRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) { }

  async upsert(
    data: SelectionProcessDocumentSyncData,
    selectionProcessId: number,
  ): Promise<number> {
    const syncedAt = new Date();

    const document =
      await this.prisma.selectionProcessDocument.upsert({
        where: {
          cidoId: data.cidoId,
        },

        create: {
          ...data,
          selectionProcessId,

          sourceActive: true,
          sourceSyncedAt: syncedAt,
          sourceLastSeenAt: syncedAt,
        },

        update: {
          ...data,
          selectionProcessId,

          sourceActive: true,
          sourceSyncedAt: syncedAt,
          sourceLastSeenAt: syncedAt,
        },

        select: {
          id: true,
        },
      });

    return document.id;
  }

  async markMissingAsInactive(
    selectionProcessId: number,
    activeCidoIds: string[],
  ): Promise<void> {
    await this.prisma.selectionProcessDocument.updateMany({
      where: {
        selectionProcessId,
        sourceActive: true,

        ...(activeCidoIds.length > 0
          ? {
            cidoId: {
              notIn: activeCidoIds,
            },
          }
          : {}),
      },

      data: {
        sourceActive: false,
      },
    });
  }
}
