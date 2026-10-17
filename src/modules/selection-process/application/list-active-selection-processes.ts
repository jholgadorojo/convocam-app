
import type { SelectionProcessPage } from "./selection-process-page";
import type { SelectionProcessQueryRepository } from "./selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

type ListActiveSelectionProcessesInput = {
  page?: number;
  pageSize?: number;
  filters?: SelectionProcessSearchFilters;
};

export class ListActiveSelectionProcesses {
  constructor(
    private readonly repository: SelectionProcessQueryRepository,
  ) {}

  async execute(
    input: ListActiveSelectionProcessesInput = {},
  ): Promise<SelectionProcessPage> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const filters = input.filters ?? {};

    if (!Number.isInteger(page) || page < 1) {
      throw new Error(
        "page must be an integer greater than or equal to 1",
      );
    }

    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      throw new Error(
        "pageSize must be an integer between 1 and 100",
      );
    }

    return this.repository.findActive(
      page,
      pageSize,
      filters,
    );
  }
}
