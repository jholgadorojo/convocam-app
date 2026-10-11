import { UserProfile } from "../../domain/user-profile";

type PrismaUserProfileData = {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  residenceMunicipalityId: number | null;
};

export class UserProfileMapper {
  static toDomain(data: PrismaUserProfileData): UserProfile {
    return UserProfile.restore({
      id: data.id,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      residenceMunicipalityId: data.residenceMunicipalityId,
    });
  }
}