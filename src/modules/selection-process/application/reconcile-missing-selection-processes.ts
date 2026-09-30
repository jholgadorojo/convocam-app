import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";

export type ReconcileMissingSelectionProcessesResult = {
  checked: number;
  updated: number;
  deactivated: number;
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

    for (const candidate of candidates) {
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
    }

    return {
      checked: candidates.length,
      updated,
      deactivated,
    };
  }
}