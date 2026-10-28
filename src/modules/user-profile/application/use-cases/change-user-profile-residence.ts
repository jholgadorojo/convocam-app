import { UserProfileRepository } from "../repositories/user-profile.repository";
import { MunicipalityQueryRepository } from "../repositories/municipality-query.repository";
import {
  UserProfileNotFoundError,
  UserProfileValidationError,
} from "../../domain/user-profile-errors";

export type ChangeUserProfileResidenceInput = {
  userId: string;
  residenceMunicipalityId: number | null;
};

export class ChangeUserProfileResidence {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly municipalityQueryRepository: MunicipalityQueryRepository,
  ) {}

  async execute(
    input: ChangeUserProfileResidenceInput,
  ): Promise<void> {
    const profile =
      await this.userProfileRepository.findByUserId(input.userId);

    if (!profile) {
      throw new UserProfileNotFoundError();
    }

    const municipalityId = input.residenceMunicipalityId;

    if (municipalityId !== null) {
      if (!Number.isInteger(municipalityId) || municipalityId <= 0) {
        throw new UserProfileValidationError(
          "El municipio de residencia no es válido",
        );
      }

      const exists =
        await this.municipalityQueryRepository.existsById(
          municipalityId,
        );

      if (!exists) {
        throw new UserProfileValidationError(
          "El municipio de residencia no existe",
        );
      }
    }

    profile.changeResidenceMunicipality(municipalityId);

    await this.userProfileRepository.save(profile);
  }
}