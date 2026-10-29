import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";
import type { SyncSelectionProcessFailure } from "./sync-selection-processes";

export type ReconcileMissingSelectionProcessesResult = {
  checked: number;
  updated: number;
  deactivated: number;
  failed: number;
  failures: SyncSelectionProcessFailure[];
};

export class ReconcileMissingSelectionProcesses {
  constructor(
    private readonly source:
      SelectionProcessSource,

    private readonly repository:
      SelectionProcessRepository,
  ) {}

  async execute(
    syncStartedAt: Date,
  ): Promise<ReconcileMissingSelectionProcessesResult> {
    const candidates =
      await this.repository.findActiveNotSeenSince(
        syncStartedAt,
      );

    let updated = 0;
    let deactivated = 0;
    const failures: SyncSelectionProcessFailure[] = [];

    for (const candidate of candidates) {
      try {
        const current =
          await this.source.getByCidoId(
            candidate.cidoId,
          );

        if (!current) {
          await this.repository.markSourceInactive(
            candidate.cidoId,
          );

          deactivated++;
          continue;
        }

        await this.repository.upsert(
          current,
          candidate.institutionId,
        );

        updated++;
      } catch (error) {
        /*
         * Un fallo en una convocatoria no detiene la
         * reconciliación. No se desactiva: sigue activa
         * y se vuelve a revisar en la próxima ejecución.
         */
        failures.push({
          cidoId: candidate.cidoId,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    return {
      checked: candidates.length,
      updated,
      deactivated,
      failed: failures.length,
      failures,
    };
  }
}
