import type { InstitutionRepository } from "./institution-repository";
import type { InstitutionSource } from "./institution-source";
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

    private readonly institutionSource:
      InstitutionSource,

    private readonly institutionRepository:
      InstitutionRepository,
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
      const institution =
        await this.institutionSource
          .getBySelectionProcessCidoId(
            selectionProcess.cidoId,
          );

      let institutionId: number | null =
        null;

      if (institution) {
        institutionId =
          await this.institutionRepository
            .upsert(institution);
      }

      await this.repository.upsert(
        selectionProcess,
        institutionId,
      );
    }

    return {
      totalAvailable: page.total,
      processed: page.items.length,
    };
  }
}