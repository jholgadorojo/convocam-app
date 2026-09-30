import type { SelectionProcessSyncData } from "./selection-process-sync-data";

export interface SelectionProcessRepository {
  upsert(
    data: SelectionProcessSyncData,
    institutionId: number | null,
  ): Promise<number>;
}