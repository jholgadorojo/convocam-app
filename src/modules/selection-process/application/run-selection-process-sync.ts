import type { ReconcileMissingSelectionProcessesResult } from "./reconcile-missing-selection-processes";
import type { ReconcileMissingSelectionProcesses } from "./reconcile-missing-selection-processes";
import type { SyncAllSelectionProcessesResult } from "./sync-all-selection-processes";
import type { SyncAllSelectionProcesses } from "./sync-all-selection-processes";

export type RunSelectionProcessSyncResult = {
  completed: true;
  sync: SyncAllSelectionProcessesResult;
  reconciliation: ReconcileMissingSelectionProcessesResult;
};

export class RunSelectionProcessSync {
  constructor(
    private readonly syncAll:
      SyncAllSelectionProcesses,

    private readonly reconcileMissing:
      ReconcileMissingSelectionProcesses,
  ) {}

  async execute(): Promise<RunSelectionProcessSyncResult> {
    const sync =
      await this.syncAll.execute();

    const reconciliation =
      await this.reconcileMissing.execute(
        sync.syncStartedAt,
      );

    return {
      completed: true,
      sync,
      reconciliation,
    };
  }
}