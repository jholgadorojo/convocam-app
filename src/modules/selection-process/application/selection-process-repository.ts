import type { SelectionProcessSyncCandidate } from "./selection-process-sync-candidate";
import type { SelectionProcessSyncData } from "./selection-process-sync-data";

export interface SelectionProcessRepository {
  upsert(
    data: SelectionProcessSyncData,
    institutionId: number | null,
  ): Promise<number>;

  findActiveNotSeenSince(
    date: Date,
  ): Promise<SelectionProcessSyncCandidate[]>;

  markSourceInactive(
    cidoId: string,
  ): Promise<void>;
}