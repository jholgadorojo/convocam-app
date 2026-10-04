import type { SelectionProcessDetailDto } from "../dto/selection-process-detail.dto";
import type { SelectionProcessDetailRepository } from "../repositories/selection-process-detail.repository.ts";

type GetSelectionProcessDetailInput = {
  id: number;
};

export class GetSelectionProcessDetail {
  constructor(
    private readonly repository: SelectionProcessDetailRepository,
  ) {}

  async execute(
    input: GetSelectionProcessDetailInput,
  ): Promise<SelectionProcessDetailDto | null> {
    return this.repository.findById(input.id);
  }
}