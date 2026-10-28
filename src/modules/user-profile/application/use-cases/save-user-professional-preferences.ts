
import { UserProfessionalPreference } from "../../domain/user-professional-preference";
import {
  UserProfileNotFoundError,
  UserProfileValidationError,
} from "../../domain/user-profile-errors";

import type {
  SaveUserProfessionalPreferencesDto,
  UserProfessionalPreferenceDto,
} from "../dto/user-professional-preference.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserProfessionalPreferenceRepository } from "../repositories/user-professional-preference.repository";

import type { ProfessionalPreferenceCatalogQueryRepository } from "../repositories/professional-preference-catalog-query.repository";

// ============================================================
// CASO DE USO: GUARDAR PREFERENCIAS PROFESIONALES
// ============================================================

export class SaveUserProfessionalPreferences {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,

    private readonly professionalPreferenceRepository: UserProfessionalPreferenceRepository,

    private readonly catalogRepository: ProfessionalPreferenceCatalogQueryRepository,
  ) {}

  async execute(
    input: SaveUserProfessionalPreferencesDto,
  ): Promise<UserProfessionalPreferenceDto> {
    // --------------------------------------------------------
    // 1. VALIDAR IDENTIFICADOR DEL USUARIO
    // --------------------------------------------------------

    if (
      typeof input.userId !== "string" ||
      input.userId.trim().length === 0
    ) {
      throw new UserProfileValidationError(
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
      throw new UserProfileNotFoundError(
        "No se ha encontrado el perfil del opositor",
      );
    }

    // --------------------------------------------------------
    // 3. VALIDAR Y NORMALIZAR LAS PREFERENCIAS
    // --------------------------------------------------------

    const normalized =
      UserProfessionalPreference.create(
        profile.id,
        {
          selectionProcessType:
            input.selectionProcessType,

          subjectAreaIds:
            input.subjectAreaIds,

          qualificationGroups:
            input.qualificationGroups,
        },
      );

    // --------------------------------------------------------
    // 4. COMPROBAR LAS OPCIONES DISPONIBLES EN CIDO
    // --------------------------------------------------------

    const [
      validSubjectAreas,
      validQualificationGroups,
    ] = await Promise.all([
      this.catalogRepository.allSubjectAreasExist(
        normalized.subjectAreaIds,
      ),

      this.catalogRepository.allQualificationGroupsExist(
        normalized.qualificationGroups,
      ),
    ]);

    if (!validSubjectAreas) {
      throw new UserProfileValidationError(
        "Alguna de las materias seleccionadas no está disponible en CIDO",
      );
    }

    if (!validQualificationGroups) {
      throw new UserProfileValidationError(
        "Alguno de los grupos de titulación seleccionados no está disponible en CIDO",
      );
    }

    // --------------------------------------------------------
    // 5. COMPROBAR SI EXISTEN PREFERENCIAS ANTERIORES
    // --------------------------------------------------------

    const existing =
      await this.professionalPreferenceRepository
        .findByUserProfileId(profile.id);

    let preference: UserProfessionalPreference;

    if (existing) {
      // Actualizamos la configuración existente,
      // conservando su identificador.

      existing.changePreferences({
        selectionProcessType:
          normalized.selectionProcessType,

        subjectAreaIds:
          normalized.subjectAreaIds,

        qualificationGroups:
          normalized.qualificationGroups,
      });

      preference = existing;
    } else {
      // El opositor todavía no tiene
      // preferencias profesionales guardadas.

      preference = normalized;
    }

    // --------------------------------------------------------
    // 6. GUARDAR LA CONFIGURACIÓN
    // --------------------------------------------------------

    const saved =
      await this.professionalPreferenceRepository.save(
        preference,
      );

    if (saved.id === undefined) {
      throw new Error(
        "No se ha podido obtener el identificador de las preferencias profesionales",
      );
    }

    // --------------------------------------------------------
    // 7. DEVOLVER RESULTADO
    // --------------------------------------------------------

    return {
      id: saved.id,

      selectionProcessType:
        saved.selectionProcessType,

      subjectAreaIds:
        saved.subjectAreaIds,

      qualificationGroups:
        saved.qualificationGroups,
    };
  }
}
