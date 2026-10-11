import { UserProfileRepository } from "../../application/repositories/user-profile.repository";
import { UserProfile } from "../../domain/user-profile";

export class InMemoryUserProfileRepository
  implements UserProfileRepository
{
  private profiles: UserProfile[] = [];
  private nextId = 1;

  async save(profile: UserProfile): Promise<UserProfile> {
    if (profile.id !== undefined) {
      const index = this.profiles.findIndex(
        (existingProfile) => existingProfile.id === profile.id,
      );

      if (index === -1) {
        throw new Error("El perfil que se intenta actualizar no existe");
      }

      this.profiles[index] = profile;
      return profile;
    }

    const savedProfile = UserProfile.restore({
      id: this.nextId++,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      residenceMunicipalityId: profile.residenceMunicipalityId,
    });

    this.profiles.push(savedProfile);

    return savedProfile;
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return (
      this.profiles.find((profile) => profile.userId === userId) ?? null
    );
  }
}