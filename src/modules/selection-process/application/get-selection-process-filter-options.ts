import type { SelectionProcessFilterOptions } from "./selection-process-filter-options";
import type { SelectionProcessQueryRepository } from "./selection-process-query-repository";

export class GetSelectionProcessFilterOptions {
  constructor(
    private readonly repository: SelectionProcessQueryRepository,
  ) {}

  async execute(): Promise<SelectionProcessFilterOptions> {
    return this.repository.getFilterOptions();
  }
}