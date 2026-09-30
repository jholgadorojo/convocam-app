import type { InstitutionSyncData } from "./institution-sync-data";

export interface InstitutionRepository {
  upsert(
    data: InstitutionSyncData,
  ): Promise<number>;
}