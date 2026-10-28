import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import type {
  SelectionProcessSyncRunRepository,
  SelectionProcessSyncRunResult,
} from "../../application/selection-process-sync-run-repository";

const STALE_RUN_ERROR =
  "La sincronización no terminó en el tiempo máximo y se ha dado por interrumpida";

export class PrismaSelectionProcessSyncRunRepository
  implements SelectionProcessSyncRunRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) { }

  async start(
    staleBefore: Date,
  ): Promise<number | null> {
    // Libera el bloqueo de las ejecuciones cuyo
    // proceso murió sin llegar a terminar.
    await this.prisma.selectionProcessSyncRun.updateMany({
      where: {
        runningLock: true,
        startedAt: {
          lt: staleBefore,
        },
      },

      data: {
        status: "FAILED",
        runningLock: null,
        finishedAt: new Date(),
        error: STALE_RUN_ERROR,
      },
    });

    try {
      const run =
        await this.prisma.selectionProcessSyncRun.create({
          data: {},

          select: {
            id: true,
          },
        });

      return run.id;
    } catch (error) {
      // P2002: runningLock es único, ya hay otra en marcha.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return null;
      }

      throw error;
    }
  }

  async complete(
    id: number,
    result: SelectionProcessSyncRunResult,
  ): Promise<void> {
    await this.prisma.selectionProcessSyncRun.update({
      where: {
        id,
      },

      data: {
        status: "COMPLETED",
        runningLock: null,
        finishedAt: new Date(),

        // El tipo Json de Prisma no admite Date.
        result: {
          sync: {
            ...result.sync,
            syncStartedAt:
              result.sync.syncStartedAt.toISOString(),
          },
          reconciliation: result.reconciliation,
        },
      },
    });
  }

  async fail(
    id: number,
    error: string,
  ): Promise<void> {
    await this.prisma.selectionProcessSyncRun.update({
      where: {
        id,
      },

      data: {
        status: "FAILED",
        runningLock: null,
        finishedAt: new Date(),
        error,
      },
    });
  }
}
