
import type {
  TerritorialPreferenceOptionsDto,
} from "../dto/territorial-preference-options.dto";

import type {
  TerritorialPreferenceOptionsQueryRepository,
} from "../repositories/territorial-preference-options-query.repository";

// ============================================================
// CASO DE USO: OBTENER OPCIONES TERRITORIALES
// ============================================================

export class GetTerritorialPreferenceOptions {
  constructor(
    private readonly repository:
      TerritorialPreferenceOptionsQueryRepository,
  ) {}

  async execute(): Promise<TerritorialPreferenceOptionsDto> {
    return this.repository.listAll();
  }
}
