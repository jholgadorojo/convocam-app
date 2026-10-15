
import type {
  GetUserProfessionalPreferencesDto,
  UserProfessionalPreferenceDto,
} from "../dto/user-professional-preference.dto";

import type {
  UserProfileRepository,
} from "../repositories/user-profile.repository";

import type {
  UserProfessionalPreferenceRepository,
} from "../repositories/user-professional-preference.repository";

// ============================================================
// CASO DE USO: CONSULTAR PREFERENCIAS PROFESIONALES
// ============================================================

export class GetUserProfessionalPreferences {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly professionalPreferenceRepository: UserProfessionalPreferenceRepository,
  ) {}

  async execute(
    input: GetUserProfessionalPreferencesDto,
  ): Promise<UserProfessionalPreferenceDto | null> {
    // --------------------------------------------------------
    // 1. RECUPERAR EL PERFIL DEL USUARIO
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    if (!profile || profile.id === undefined) {
      return null;
    }

    // --------------------------------------------------------
    // 2. RECUPERAR LAS PREFERENCIAS PROFESIONALES
    // --------------------------------------------------------

    const preference =
      await this.professionalPreferenceRepository
        .findByUserProfileId(profile.id);

    if (!preference) {
      return null;
    }

    // --------------------------------------------------------
    // 3. COMPROBAR EL IDENTIFICADOR
    // --------------------------------------------------------

    if (preference.id === undefined) {
      throw new Error(
        "Las preferencias profesionales no tienen identificador",
      );
    }

    // --------------------------------------------------------
    // 4. DEVOLVER LOS DATOS
    // --------------------------------------------------------

    return {
      id: preference.id,

      selectionProcessType:
        preference.selectionProcessType,

      subjectAreaIds:
        preference.subjectAreaIds,

      qualificationGroups:
        preference.qualificationGroups,
    };
  }
}
