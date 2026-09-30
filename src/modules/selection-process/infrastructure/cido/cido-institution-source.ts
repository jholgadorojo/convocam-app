import type { InstitutionSource } from "../../application/institution-source";
import type { InstitutionSyncData } from "../../application/institution-sync-data";

import { getCidoInstitution } from "./cido-client";
import { mapCidoInstitution } from "./cido-institution-mapper";

export class CidoInstitutionSource
  implements InstitutionSource
{
  async getBySelectionProcessCidoId(
    selectionProcessCidoId: string,
  ): Promise<InstitutionSyncData | null> {
    const response =
      await getCidoInstitution(
        selectionProcessCidoId,
      );

    if (!response.data) {
      return null;
    }

    return mapCidoInstitution(
      response.data,
    );
  }
}