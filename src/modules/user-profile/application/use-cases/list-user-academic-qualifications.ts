
import type {
  ListUserAcademicQualificationsDto,
  UserAcademicQualificationDto,
} from "../dto/user-academic-qualification.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserAcademicQualificationRepository } from "../repositories/user-academic-qualification.repository";

// ============================================================
// CASO DE USO: CONSULTAR TITULACIONES ACADÉMICAS
// ============================================================

export class ListUserAcademicQualifications {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly academicQualificationRepository: UserAcademicQualificationRepository,
  ) {}

  async execute(
    input: ListUserAcademicQualificationsDto,
  ): Promise<UserAcademicQualificationDto[]> {
    // --------------------------------------------------------
    // 1. RECUPERAR EL PERFIL DEL USUARIO
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    // Si el perfil todavía no existe, no hay titulaciones.
    if (!profile || profile.id === undefined) {
      return [];
    }

    // --------------------------------------------------------
    // 2. CONSULTAR SUS TITULACIONES
    // --------------------------------------------------------

    const qualifications =
      await this.academicQualificationRepository
        .listByUserProfileId(profile.id);

    // --------------------------------------------------------
    // 3. CONVERTIR LAS ENTIDADES A DTO
    // --------------------------------------------------------

    return qualifications.map((qualification) => {
      if (qualification.id === undefined) {
        throw new Error(
          "La titulación académica no tiene identificador",
        );
      }

      return {
        id: qualification.id,
        qualificationType:
          qualification.qualificationType,
        name: qualification.name,
      };
    });
  }
}
