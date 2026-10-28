
import type {
  UpdateUserAcademicQualificationDto,
  UserAcademicQualificationDto,
} from "../dto/user-academic-qualification.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserAcademicQualificationRepository } from "../repositories/user-academic-qualification.repository";

import {
  AcademicQualificationNotFoundError,
  UserProfileNotFoundError,
} from "../../domain/user-profile-errors";

// ============================================================
// CASO DE USO: MODIFICAR TITULACIÓN ACADÉMICA
// ============================================================

export class UpdateUserAcademicQualification {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly academicQualificationRepository: UserAcademicQualificationRepository,
  ) {}

  async execute(
    input: UpdateUserAcademicQualificationDto,
  ): Promise<UserAcademicQualificationDto> {
    // --------------------------------------------------------
    // 1. RECUPERAR EL PERFIL DEL USUARIO
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    if (!profile || profile.id === undefined) {
      throw new UserProfileNotFoundError();
    }

    // --------------------------------------------------------
    // 2. VALIDAR EL IDENTIFICADOR
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
    // 3. RECUPERAR LA TITULACIÓN DEL PERFIL
    // --------------------------------------------------------

    const qualification =
      await this.academicQualificationRepository
        .findByIdAndUserProfileId(
          input.qualificationId,
          profile.id,
        );

    if (!qualification) {
      throw new AcademicQualificationNotFoundError();
    }

    // --------------------------------------------------------
    // 4. MODIFICAR LA ENTIDAD DE DOMINIO
    // --------------------------------------------------------

    qualification.changeDetails(
      input.qualificationType,
      input.name,
    );

    // --------------------------------------------------------
    // 5. GUARDAR LOS CAMBIOS
    // --------------------------------------------------------

    const updated =
      await this.academicQualificationRepository.save(
        qualification,
      );

    if (updated.id === undefined) {
      throw new Error(
        "No se ha podido actualizar la titulación académica",
      );
    }

    // --------------------------------------------------------
    // 6. DEVOLVER RESULTADO
    // --------------------------------------------------------

    return {
      id: updated.id,
      qualificationType: updated.qualificationType,
      name: updated.name,
    };
  }
}
