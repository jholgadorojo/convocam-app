import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessDocumentRepository } from "../../application/selection-process-document-repository";
import type { SelectionProcessDocumentSyncData } from "../../application/selection-process-document-sync-data";

export class PrismaSelectionProcessDocumentRepository
  implements SelectionProcessDocumentRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

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
          sourceSyncedAt: syncedAt,
        },

        update: {
          ...data,
          selectionProcessId,
          sourceSyncedAt: syncedAt,
        },

        select: {
          id: true,
        },
      });

    return document.id;
  }
}