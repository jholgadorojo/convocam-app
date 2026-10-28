import type { ReconcileMissingSelectionProcessesResult } from "./reconcile-missing-selection-processes";
import type { SyncAllSelectionProcessesResult } from "./sync-all-selection-processes";

export type SelectionProcessSyncRunResult = {
  sync: SyncAllSelectionProcessesResult;
  reconciliation: ReconcileMissingSelectionProcessesResult;
};

export interface SelectionProcessSyncRunRepository {
  /**
   * Registra una sincronización en marcha y devuelve su id,
   * o null si ya hay otra en marcha. Antes da por interrumpidas
   * las que siguen en marcha desde antes de staleBefore.
   */
  start(staleBefore: Date): Promise<number | null>;

  complete(
    id: number,
    result: SelectionProcessSyncRunResult,
  ): Promise<void>;

  fail(id: number, error: string): Promise<void>;
}
