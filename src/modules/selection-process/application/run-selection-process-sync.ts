import type { ReconcileMissingSelectionProcessesResult } from "./reconcile-missing-selection-processes";
import type { ReconcileMissingSelectionProcesses } from "./reconcile-missing-selection-processes";
import type { SelectionProcessSyncRunRepository } from "./selection-process-sync-run-repository";
import type { SyncAllSelectionProcessesResult } from "./sync-all-selection-processes";
import type { SyncAllSelectionProcesses } from "./sync-all-selection-processes";

// Una sincronización completa tarda unos 40 minutos. Si sigue
// en marcha pasado este tiempo, su proceso murió sin terminar.
const SYNC_RUN_MAX_DURATION_MS = 2 * 60 * 60 * 1000;

export type RunSelectionProcessSyncResult =
  | {
    completed: true;
    syncRunId: number;
    sync: SyncAllSelectionProcessesResult;
    reconciliation: ReconcileMissingSelectionProcessesResult;
  }
  | {
    completed: false;
    reason: "ALREADY_RUNNING";
  };

export class RunSelectionProcessSync {
  constructor(
    private readonly syncAll:
      SyncAllSelectionProcesses,

    private readonly reconcileMissing:
      ReconcileMissingSelectionProcesses,

    private readonly syncRuns:
      SelectionProcessSyncRunRepository,

    private readonly now:
      () => Date = () => new Date(),
  ) {}

  async execute(): Promise<RunSelectionProcessSyncResult> {
    const syncRunId =
      await this.syncRuns.start(
        new Date(
          this.now().getTime() -
          SYNC_RUN_MAX_DURATION_MS,
        ),
      );

    if (syncRunId === null) {
      return {
        completed: false,
        reason: "ALREADY_RUNNING",
      };
    }

    try {
      const sync =
        await this.syncAll.execute();

      const reconciliation =
        await this.reconcileMissing.execute(
          sync.syncStartedAt,
        );

      await this.syncRuns.complete(
        syncRunId,
        {
          sync,
          reconciliation,
        },
      );

      return {
        completed: true,
        syncRunId,
        sync,
        reconciliation,
      };
    } catch (error) {
      await this.syncRuns.fail(
        syncRunId,
        error instanceof Error
          ? error.message
          : String(error),
      );

      throw error;
    }
  }
}
