import type { InstitutionRepository } from "./institution-repository";
import type { InstitutionSource } from "./institution-source";
import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";
import type { SelectionProcessSubjectAreaRepository } from "./selection-process-subject-area-repository";
import type { SelectionProcessSyncData } from "./selection-process-sync-data";
import type { SubjectAreaRepository } from "./subject-area-repository";
import type { SubjectAreaSource } from "./subject-area-source";
import type { SelectionProcessDocumentRepository } from "./selection-process-document-repository";
import type { SelectionProcessDocumentSource } from "./selection-process-document-source";

export type SyncSelectionProcessFailure = {
  cidoId: string;
  message: string;
};

export type SyncSelectionProcessesResult = {
  totalAvailable: number;
  processed: number;
  failed: number;
  failures: SyncSelectionProcessFailure[];
  institutionsProcessed: number;
  subjectAreasProcessed: number;
  documentsProcessed: number;
};

type SyncedCidoIds = {
  institutionCidoIds: Set<string>;
  subjectAreaCidoIds: Set<string>;
  documentCidoIds: Set<string>;
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

    private readonly documentSource:
      SelectionProcessDocumentSource,

    private readonly documentRepository:
      SelectionProcessDocumentRepository,
  ) { }

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

    const syncedCidoIds: SyncedCidoIds = {
      institutionCidoIds: new Set<string>(),
      subjectAreaCidoIds: new Set<string>(),
      documentCidoIds: new Set<string>(),
    };

    // Las convocatorias descartadas por el origen cuentan
    // como fallos; la reconciliación también las vuelve a
    // consultar al final.
    const failures: SyncSelectionProcessFailure[] = [
      ...page.rejected,
    ];

    for (const selectionProcess of page.items) {
      try {
        await this.syncSelectionProcess(
          selectionProcess,
          syncedCidoIds,
        );
      } catch (error) {
        /*
         * Un fallo en una convocatoria no detiene la
         * página. Como no se actualiza su
         * sourceLastSeenAt, la reconciliación la
         * vuelve a consultar al final.
         */
        failures.push({
          cidoId: selectionProcess.cidoId,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    return {
      totalAvailable: page.total,
      // Convocatorias leídas de la página, incluidas
      // las que han fallado o se han descartado:
      // SyncAllSelectionProcesses lo usa para detectar
      // la última página.
      processed:
        page.items.length + page.rejected.length,
      failed: failures.length,
      failures,
      institutionsProcessed:
        syncedCidoIds.institutionCidoIds.size,
      subjectAreasProcessed:
        syncedCidoIds.subjectAreaCidoIds.size,
      documentsProcessed:
        syncedCidoIds.documentCidoIds.size,
    };
  }

  private async syncSelectionProcess(
    selectionProcess: SelectionProcessSyncData,
    {
      institutionCidoIds,
      subjectAreaCidoIds,
      documentCidoIds,
    }: SyncedCidoIds,
  ): Promise<void> {
    // 1. Institución
    const institution =
      await this.institutionSource
        .getBySelectionProcessCidoId(
          selectionProcess.cidoId,
        );

    let institutionId: number | null =
      null;

    if (institution) {
      institutionCidoIds.add(
        institution.cidoId,
      );

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
      subjectAreaCidoIds.add(
        subjectArea.cidoId,
      );
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

    // 5. Documentos
    const documents =
      await this.documentSource
        .getBySelectionProcessCidoId(
          selectionProcess.cidoId,
        );

    for (const document of documents) {
      documentCidoIds.add(
        document.cidoId,
      );

      await this.documentRepository.upsert(
        document,
        selectionProcessId,
      );
    }

    // 6. Documentos que ya no están en CIDO
    await this.documentRepository
      .markMissingAsInactive(
        selectionProcessId,
        documents.map(
          (document) => document.cidoId,
        ),
      );
  }
}
