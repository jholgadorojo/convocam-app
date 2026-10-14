
import type {
  DeleteUserAcademicQualificationDto,
} from "../dto/user-academic-qualification.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserAcademicQualificationRepository } from "../repositories/user-academic-qualification.repository";

// ============================================================
// CASO DE USO: ELIMINAR TITULACIÓN ACADÉMICA
// ============================================================

export class DeleteUserAcademicQualification {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly academicQualificationRepository: UserAcademicQualificationRepository,
  ) {}

  async execute(
    input: DeleteUserAcademicQualificationDto,
  ): Promise<void> {
    // --------------------------------------------------------
    // 1. RECUPERAR PERFIL DEL USUARIO
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
    // 2. VALIDAR IDENTIFICADOR DE LA TITULACIÓN
    // --------------------------------------------------------

    if (
      !Number.isSafeInteger(input.qualificationId) ||
      input.qualificationId <= 0
    ) {
      throw new Error(
        "El identificador de la titulación no es válido",
      );
    }

    // --------------------------------------------------------
    // 3. ELIMINAR LA TITULACIÓN DEL PERFIL
    // --------------------------------------------------------

    const deleted =
      await this.academicQualificationRepository
        .deleteByIdAndUserProfileId(
          input.qualificationId,
          profile.id,
        );

    // --------------------------------------------------------
    // 4. COMPROBAR EL RESULTADO
    // --------------------------------------------------------

    if (!deleted) {
      throw new Error(
        "La titulación académica no existe",
      );
    }
  }
}
