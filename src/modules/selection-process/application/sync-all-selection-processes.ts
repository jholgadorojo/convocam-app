import type {
  SyncSelectionProcesses,
  SyncSelectionProcessesResult,
} from "./sync-selection-processes";

export type SyncAllSelectionProcessesResult = {
  syncStartedAt: Date;
  totalAvailable: number;
  processed: number;
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

    while (true) {
      const result: SyncSelectionProcessesResult =
        await this.syncSelectionProcesses.execute({
          limit: pageSize,
          offset,
        });

      totalAvailable = result.totalAvailable;
      processed += result.processed;
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
      pagesProcessed,
    };
  }
}