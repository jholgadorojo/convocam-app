import { CreateUserProfileDto } from "../dto/create-user-profile.dto";
import { UserProfileDto } from "../dto/user-profile.dto";
import { UserProfileRepository } from "../repositories/user-profile.repository";
import { UserProfile } from "../../domain/user-profile";

export class CreateUserProfile {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(input: CreateUserProfileDto): Promise<UserProfileDto> {
    const existingProfile =
      await this.userProfileRepository.findByUserId(input.userId);

    if (existingProfile) {
      throw new Error("El usuario ya tiene un perfil");
    }

    const profile = UserProfile.create({
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const savedProfile =
      await this.userProfileRepository.save(profile);

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