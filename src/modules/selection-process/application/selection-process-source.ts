import type { SelectionProcessSyncData } from "./selection-process-sync-data";

export type SelectionProcessSourcePage = {
  total: number;
  items: SelectionProcessSyncData[];
};

export interface SelectionProcessSource {
  getPage(params: {
    limit: number;
    offset: number;
  }): Promise<SelectionProcessSourcePage>;

  getByCidoId(
    cidoId: string,
  ): Promise<SelectionProcessSyncData | null>;
}