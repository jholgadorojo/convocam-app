import { GetUserProfileDto } from "../dto/get-user-profile.dto";
import { UserProfileDto } from "../dto/user-profile.dto";
import { UserProfileRepository } from "../repositories/user-profile.repository";

export class GetUserProfile {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(
    input: GetUserProfileDto,
  ): Promise<UserProfileDto | null> {
    const profile =
      await this.userProfileRepository.findByUserId(input.userId);

    if (!profile) {
      return null;
    }

    if (!profile.id) {
      throw new Error("El perfil recuperado no tiene un identificador válido");
    }

    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  }
}