import type { SubjectAreaSyncData } from "./subject-area-sync-data";

export interface SubjectAreaRepository {
  upsert(
    data: SubjectAreaSyncData,
  ): Promise<number>;
}