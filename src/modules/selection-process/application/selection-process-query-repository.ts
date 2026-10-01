import type { SelectionProcessFilterOptions } from "./selection-process-filter-options";
import type { SelectionProcessPage } from "./selection-process-page";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

export interface SelectionProcessQueryRepository {
  findActive(
    page: number,
    pageSize: number,
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessPage>;

  getFilterOptions(): Promise<SelectionProcessFilterOptions>;
}