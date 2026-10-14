
import type {
  DeleteUserTerritorialPreferencesDto,
} from "../dto/user-territorial-preference.dto";

import type {
  UserProfileRepository,
} from "../repositories/user-profile.repository";

import type {
  UserTerritorialPreferenceRepository,
} from "../repositories/user-territorial-preference.repository";

// ============================================================
// CASO DE USO: ELIMINAR PREFERENCIAS TERRITORIALES
// ============================================================

export class DeleteUserTerritorialPreferences {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly territorialPreferenceRepository: UserTerritorialPreferenceRepository,
  ) {}

  async execute(
    input: DeleteUserTerritorialPreferencesDto,
  ): Promise<boolean> {
    // --------------------------------------------------------
    // 1. RECUPERAR EL PERFIL DEL USUARIO
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    if (!profile || profile.id === undefined) {
      throw new Error(
        "El usuario no tiene un perfil",
      );
    }

    // --------------------------------------------------------
    // 2. ELIMINAR SUS PREFERENCIAS TERRITORIALES
    // --------------------------------------------------------

    return this.territorialPreferenceRepository
      .deleteByUserProfileId(profile.id);
  }
}
