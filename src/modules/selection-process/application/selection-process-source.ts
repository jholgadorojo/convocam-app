import type { SelectionProcessSyncData } from "./selection-process-sync-data";

// Convocatoria de la página descartada por no tener
// el formato esperado.
export type SelectionProcessSourceRejection = {
  cidoId: string;
  message: string;
};

export type SelectionProcessSourcePage = {
  total: number;
  items: SelectionProcessSyncData[];
  rejected: SelectionProcessSourceRejection[];
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