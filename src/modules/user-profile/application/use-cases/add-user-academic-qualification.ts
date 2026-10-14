
import { UserAcademicQualification } from "../../domain/user-academic-qualification";

import type {
  AddUserAcademicQualificationDto,
  UserAcademicQualificationDto,
} from "../dto/user-academic-qualification.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserAcademicQualificationRepository } from "../repositories/user-academic-qualification.repository";

// ============================================================
// CASO DE USO: AÑADIR TITULACIÓN ACADÉMICA
// ============================================================

export class AddUserAcademicQualification {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly academicQualificationRepository: UserAcademicQualificationRepository,
  ) {}

  async execute(
    input: AddUserAcademicQualificationDto,
  ): Promise<UserAcademicQualificationDto> {
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
    // 2. CREAR ENTIDAD DE DOMINIO
    // --------------------------------------------------------

    const qualification =
      UserAcademicQualification.create({
        userProfileId: profile.id,
        qualificationType: input.qualificationType,
        name: input.name,
      });

    // --------------------------------------------------------
    // 3. GUARDAR TITULACIÓN
    // --------------------------------------------------------

    const savedQualification =
      await this.academicQualificationRepository.save(
        qualification,
      );

    if (savedQualification.id === undefined) {
      throw new Error(
        "No se ha podido guardar la titulación académica",
      );
    }

    // --------------------------------------------------------
    // 4. DEVOLVER RESULTADO
    // --------------------------------------------------------

    return {
      id: savedQualification.id,
      qualificationType:
        savedQualification.qualificationType,
      name: savedQualification.name,
    };
  }
}
