
import type {
  DeleteUserProfessionalPreferencesDto,
} from "../dto/user-professional-preference.dto";

import type {
  UserProfileRepository,
} from "../repositories/user-profile.repository";

import type {
  UserProfessionalPreferenceRepository,
} from "../repositories/user-professional-preference.repository";

// ============================================================
// CASO DE USO: ELIMINAR PREFERENCIAS PROFESIONALES
// ============================================================

export class DeleteUserProfessionalPreferences {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,

    private readonly professionalPreferenceRepository: UserProfessionalPreferenceRepository,
  ) {}

  async execute(
    input: DeleteUserProfessionalPreferencesDto,
  ): Promise<boolean> {
    // --------------------------------------------------------
    // 1. VALIDAR IDENTIFICADOR DEL USUARIO
    // --------------------------------------------------------

    if (
      !input ||
      typeof input.userId !== "string" ||
      input.userId.trim().length === 0
    ) {
      throw new Error(
        "El identificador del usuario no es válido",
      );
    }

    // --------------------------------------------------------
    // 2. LOCALIZAR EL PERFIL DEL OPOSITOR
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    if (!profile || profile.id === undefined) {
      throw new Error(
        "No se ha encontrado el perfil del opositor",
      );
    }

    // --------------------------------------------------------
    // 3. ELIMINAR SUS PREFERENCIAS PROFESIONALES
    // --------------------------------------------------------

    return this.professionalPreferenceRepository
      .deleteByUserProfileId(profile.id);
  }
}
