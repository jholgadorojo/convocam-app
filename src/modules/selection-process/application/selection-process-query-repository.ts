import type { SelectionProcessPage } from "./selection-process-page";

export interface SelectionProcessQueryRepository {
  findActive(
    page: number,
    pageSize: number,
  ): Promise<SelectionProcessPage>;
}