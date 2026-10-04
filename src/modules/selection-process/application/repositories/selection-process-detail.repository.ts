import type { SelectionProcessDetailDto } from "../dto/selection-process-detail.dto";

export interface SelectionProcessDetailRepository {
  findById(id: number): Promise<SelectionProcessDetailDto | null>;
}