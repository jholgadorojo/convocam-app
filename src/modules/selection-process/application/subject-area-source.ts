import type { SubjectAreaSyncData } from "./subject-area-sync-data";

export interface SubjectAreaSource {
  getBySelectionProcessCidoId(
    selectionProcessCidoId: string,
  ): Promise<SubjectAreaSyncData[]>;
}