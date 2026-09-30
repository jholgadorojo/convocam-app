import type { SubjectAreaSource } from "../../application/subject-area-source";
import type { SubjectAreaSyncData } from "../../application/subject-area-sync-data";

import { getCidoSubjectAreas } from "./cido-client";
import { mapCidoSubjectArea } from "./cido-subject-area-mapper";

export class CidoSubjectAreaSource
  implements SubjectAreaSource
{
  async getBySelectionProcessCidoId(
    selectionProcessCidoId: string,
  ): Promise<SubjectAreaSyncData[]> {
    const response =
      await getCidoSubjectAreas(
        selectionProcessCidoId,
      );

    return response.data.map(
      mapCidoSubjectArea,
    );
  }
}