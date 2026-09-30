import type { SelectionProcessSyncData } from "./selection-process-sync-data";

export interface SelectionProcessRepository {
  upsert(
    data: SelectionProcessSyncData,
  ): Promise<number>;
}