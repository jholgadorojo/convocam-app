import type {
  SyncSelectionProcessFailure,
  SyncSelectionProcesses,
  SyncSelectionProcessesResult,
} from "./sync-selection-processes";

export type SyncAllSelectionProcessesResult = {
  syncStartedAt: Date;
  totalAvailable: number;
  processed: number;
  failed: number;
  failures: SyncSelectionProcessFailure[];
  pagesProcessed: number;
};

export class SyncAllSelectionProcesses {
  constructor(
    private readonly syncSelectionProcesses:
      SyncSelectionProcesses,
  ) {}

  async execute({
    pageSize = 500,
  }: {
    pageSize?: number;
  } = {}): Promise<SyncAllSelectionProcessesResult> {
    const syncStartedAt = new Date();

    let offset = 0;
    let processed = 0;
    let pagesProcessed = 0;
    let totalAvailable = 0;

    const failures: SyncSelectionProcessFailure[] = [];

    while (true) {
      const result: SyncSelectionProcessesResult =
        await this.syncSelectionProcesses.execute({
          limit: pageSize,
          offset,
        });

      totalAvailable = result.totalAvailable;
      processed += result.processed;
      failures.push(...result.failures);
      pagesProcessed++;

      if (result.processed < pageSize) {
        break;
      }

      offset += pageSize;

      if (offset >= totalAvailable) {
        break;
      }
    }

    return {
      syncStartedAt,
      totalAvailable,
      processed,
      failed: failures.length,
      failures,
      pagesProcessed,
    };
  }
}
