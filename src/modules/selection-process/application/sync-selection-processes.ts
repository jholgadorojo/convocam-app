import type { InstitutionRepository } from "./institution-repository";
import type { InstitutionSource } from "./institution-source";
import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";
import type { SelectionProcessSubjectAreaRepository } from "./selection-process-subject-area-repository";
import type { SubjectAreaRepository } from "./subject-area-repository";
import type { SubjectAreaSource } from "./subject-area-source";

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

    private readonly subjectAreaSource:
      SubjectAreaSource,

    private readonly subjectAreaRepository:
      SubjectAreaRepository,

    private readonly selectionProcessSubjectAreaRepository:
      SelectionProcessSubjectAreaRepository,
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
      // 1. Institución
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

      // 2. Proceso selectivo
      const selectionProcessId =
        await this.repository.upsert(
          selectionProcess,
          institutionId,
        );

      // 3. Materias
      const subjectAreas =
        await this.subjectAreaSource
          .getBySelectionProcessCidoId(
            selectionProcess.cidoId,
          );

      const subjectAreaIds: number[] = [];

      for (const subjectArea of subjectAreas) {
        const subjectAreaId =
          await this.subjectAreaRepository
            .upsert(subjectArea);

        subjectAreaIds.push(subjectAreaId);
      }

      // 4. Relaciones convocatoria ↔ materias
      await this
        .selectionProcessSubjectAreaRepository
        .replaceAll(
          selectionProcessId,
          subjectAreaIds,
        );
    }

    return {
      totalAvailable: page.total,
      processed: page.items.length,
    };
  }
}