import type { SelectionProcessDocumentSyncData } from "./selection-process-document-sync-data";

export interface SelectionProcessDocumentRepository {
  upsert(
    data: SelectionProcessDocumentSyncData,
    selectionProcessId: number,
  ): Promise<number>;
}