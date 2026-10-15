
import type {
  ProfessionalPreferenceOptionsDto,
} from "../dto/professional-preference-options.dto";

import type {
  ProfessionalPreferenceOptionsQueryRepository,
} from "../repositories/professional-preference-options-query.repository";

// ============================================================
// CASO DE USO: OBTENER OPCIONES PROFESIONALES
// ============================================================

export class GetProfessionalPreferenceOptions {
  constructor(
    private readonly optionsRepository:
      ProfessionalPreferenceOptionsQueryRepository,
  ) {}

  async execute(): Promise<ProfessionalPreferenceOptionsDto> {
    return this.optionsRepository.listAll();
  }
}
