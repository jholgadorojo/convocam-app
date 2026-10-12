
import { UserProfile } from "../../domain/user-profile";

import { ChangeUserProfilePersonalDataDto } from "../dto/change-user-profile-personal-data.dto";
import { UserProfileDto } from "../dto/user-profile.dto";

import { UserProfileRepository } from "../repositories/user-profile.repository";
import { UserPersonalDataUnitOfWork } from "../repositories/user-personal-data-unit-of-work";

export class ChangeUserProfilePersonalData {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly unitOfWork: UserPersonalDataUnitOfWork,
  ) {}

  async execute(
    input: ChangeUserProfilePersonalDataDto,
  ): Promise<UserProfileDto> {
    // Recuperar el perfil actual
    const existingProfile =
      await this.userProfileRepository.findByUserId(input.userId);

    let profile: UserProfile;

    if (existingProfile) {
      // Modificar los datos personales
      existingProfile.changePersonalData(
        input.firstName,
        input.lastName,
      );

      profile = existingProfile;
    } else {
      // Crear el perfil si todavía no existe
      profile = UserProfile.create({
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
      });
    }

    // Guardar el perfil y sincronizar User.name
    // mediante una única transacción
    const savedProfile =
      await this.unitOfWork.saveProfileAndUserName(profile);

    if (!savedProfile.id) {
      throw new Error("No se ha podido guardar el perfil");
    }

    return {
      id: savedProfile.id,
      userId: savedProfile.userId,
      firstName: savedProfile.firstName,
      lastName: savedProfile.lastName,
    };
  }
}
