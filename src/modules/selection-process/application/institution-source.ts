import type { InstitutionSyncData } from "./institution-sync-data";

export interface InstitutionSource {
  getBySelectionProcessCidoId(
    selectionProcessCidoId: string,
  ): Promise<InstitutionSyncData | null>;
}