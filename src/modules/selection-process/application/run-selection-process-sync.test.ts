import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ReconcileMissingSelectionProcesses,
  ReconcileMissingSelectionProcessesResult,
} from "./reconcile-missing-selection-processes";
import type { SelectionProcessSyncRunRepository } from "./selection-process-sync-run-repository";
import type {
  SyncAllSelectionProcesses,
  SyncAllSelectionProcessesResult,
} from "./sync-all-selection-processes";

import { RunSelectionProcessSync } from "./run-selection-process-sync";

const SYNC_RUN_ID = 7;

const syncResult: SyncAllSelectionProcessesResult = {
  syncStartedAt: new Date("2026-10-28T09:00:00.000Z"),
  totalAvailable: 2,
  processed: 2,
  failed: 0,
  failures: [],
  pagesProcessed: 1,
};

const reconciliationResult: ReconcileMissingSelectionProcessesResult = {
  checked: 1,
  updated: 0,
  deactivated: 1,
  failed: 0,
  failures: [],
};

function buildUseCase({
  syncRunId = SYNC_RUN_ID,
  syncError,
}: {
  syncRunId?: number | null;
  syncError?: Error;
} = {}) {
  const syncAllExecute = vi.fn(async () => {
    if (syncError) {
      throw syncError;
    }

    return syncResult;
  });

  const reconcileExecute = vi.fn(
    async (_syncStartedAt: Date) =>
      reconciliationResult,
  );

  // Clases con miembros privados: los dobles
  // necesitan el cast.
  const syncAll = {
    execute: syncAllExecute,
  } as unknown as SyncAllSelectionProcesses;

  const reconcileMissing = {
    execute: reconcileExecute,
  } as unknown as ReconcileMissingSelectionProcesses;

  const syncRuns = {
    start: vi.fn(async (_staleBefore: Date) => syncRunId),
    complete: vi.fn(async () => {}),
    fail: vi.fn(async () => {}),
  } satisfies SelectionProcessSyncRunRepository;

  const useCase = new RunSelectionProcessSync(
    syncAll,
    reconcileMissing,
    syncRuns,
    () => new Date("2026-10-28T10:00:00.000Z"),
  );

  return {
    useCase,
    syncAllExecute,
    reconcileExecute,
    syncRuns,
  };
}

describe("RunSelectionProcessSync", () => {
  it("no ejecuta nada si ya hay una sincronización en marcha", async () => {
    const {
      useCase,
      syncAllExecute,
      reconcileExecute,
      syncRuns,
    } = buildUseCase({
      syncRunId: null,
    });

    const result = await useCase.execute();

    expect(result).toEqual({
      completed: false,
      reason: "ALREADY_RUNNING",
    });

    expect(syncAllExecute).not.toHaveBeenCalled();
    expect(reconcileExecute).not.toHaveBeenCalled();
    expect(syncRuns.complete).not.toHaveBeenCalled();
    expect(syncRuns.fail).not.toHaveBeenCalled();
  });

  it("sincroniza, reconcilia y registra el resultado", async () => {
    const {
      useCase,
      reconcileExecute,
      syncRuns,
    } = buildUseCase();

    const result = await useCase.execute();

    expect(reconcileExecute).toHaveBeenCalledWith(
      syncResult.syncStartedAt,
    );

    expect(syncRuns.complete).toHaveBeenCalledWith(
      SYNC_RUN_ID,
      {
        sync: syncResult,
        reconciliation: reconciliationResult,
      },
    );

    expect(syncRuns.fail).not.toHaveBeenCalled();

    expect(result).toEqual({
      completed: true,
      syncRunId: SYNC_RUN_ID,
      sync: syncResult,
      reconciliation: reconciliationResult,
    });
  });

  it("registra el error y lo relanza cuando falla la sincronización", async () => {
    const {
      useCase,
      reconcileExecute,
      syncRuns,
    } = buildUseCase({
      syncError: new Error("CIDO no disponible"),
    });

    await expect(
      useCase.execute(),
    ).rejects.toThrow("CIDO no disponible");

    expect(syncRuns.fail).toHaveBeenCalledWith(
      SYNC_RUN_ID,
      "CIDO no disponible",
    );

    expect(reconcileExecute).not.toHaveBeenCalled();
    expect(syncRuns.complete).not.toHaveBeenCalled();
  });

  it("da por colgadas las ejecuciones de más de 2 horas", async () => {
    const { useCase, syncRuns } = buildUseCase();

    await useCase.execute();

    expect(syncRuns.start).toHaveBeenCalledWith(
      new Date("2026-10-28T08:00:00.000Z"),
    );
  });
});
