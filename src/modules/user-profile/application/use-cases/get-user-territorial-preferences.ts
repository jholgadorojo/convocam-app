
import type {
  GetUserTerritorialPreferencesDto,
  UserTerritorialPreferenceDto,
} from "../dto/user-territorial-preference.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserTerritorialPreferenceRepository } from "../repositories/user-territorial-preference.repository";

// ============================================================
// CASO DE USO: CONSULTAR PREFERENCIAS TERRITORIALES
// ============================================================

export class GetUserTerritorialPreferences {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly territorialPreferenceRepository: UserTerritorialPreferenceRepository,
  ) {}

  async execute(
    input: GetUserTerritorialPreferencesDto,
  ): Promise<UserTerritorialPreferenceDto | null> {
    // --------------------------------------------------------
    // 1. RECUPERAR PERFIL DEL USUARIO
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    if (!profile || profile.id === undefined) {
      return null;
    }

    // --------------------------------------------------------
    // 2. RECUPERAR PREFERENCIAS TERRITORIALES
    // --------------------------------------------------------

    const preference =
      await this.territorialPreferenceRepository
        .findByUserProfileId(profile.id);

    if (!preference) {
      return null;
    }

    // --------------------------------------------------------
    // 3. COMPROBAR IDENTIFICADOR
    // --------------------------------------------------------

    if (preference.id === undefined) {
      throw new Error(
        "Las preferencias territoriales no tienen identificador",
      );
    }

    // --------------------------------------------------------
    // 4. DEVOLVER DTO
    // --------------------------------------------------------

    return {
      id: preference.id,
      scope: preference.scope,
      provinceIds: preference.provinceIds,
      countyIds: preference.countyIds,
      municipalityIds: preference.municipalityIds,
    };
  }
}
