import type { SelectionProcessDocumentSyncData } from "./selection-process-document-sync-data";

export interface SelectionProcessDocumentSource {
  getBySelectionProcessCidoId(
    selectionProcessCidoId: string,
  ): Promise<SelectionProcessDocumentSyncData[]>;
}