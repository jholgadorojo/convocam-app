import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";

export type SyncSelectionProcessesResult = {
  totalAvailable: number;
  processed: number;
};

export class SyncSelectionProcesses {
  constructor(
    private readonly source:
      SelectionProcessSource,
    private readonly repository:
      SelectionProcessRepository,
  ) {}

  async execute({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<SyncSelectionProcessesResult> {
    const page = await this.source.getPage({
      limit,
      offset,
    });

    for (const selectionProcess of page.items) {
      await this.repository.upsert(
        selectionProcess,
      );
    }

    return {
      totalAvailable: page.total,
      processed: page.items.length,
    };
  }
}