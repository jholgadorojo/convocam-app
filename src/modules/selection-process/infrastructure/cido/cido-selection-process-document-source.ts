import type { SelectionProcessDocumentSource } from "../../application/selection-process-document-source";
import type { SelectionProcessDocumentSyncData } from "../../application/selection-process-document-sync-data";

import { getCidoSelectionProcessDocuments } from "./cido-client";
import { mapCidoSelectionProcessDocument } from "./cido-selection-process-document-mapper";

export class CidoSelectionProcessDocumentSource
  implements SelectionProcessDocumentSource
{
  async getBySelectionProcessCidoId(
    selectionProcessCidoId: string,
  ): Promise<SelectionProcessDocumentSyncData[]> {
    const response =
      await getCidoSelectionProcessDocuments(
        selectionProcessCidoId,
      );

    return response.data.map(
      mapCidoSelectionProcessDocument,
    );
  }
}