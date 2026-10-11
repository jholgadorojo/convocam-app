import { PrismaClient } from "@/generated/prisma/client";

import { UserProfileRepository } from "../../application/repositories/user-profile.repository";
import { UserProfile } from "../../domain/user-profile";
import { UserProfileMapper } from "../mappers/user-profile.mapper";

export class PrismaUserProfileRepository
  implements UserProfileRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async save(profile: UserProfile): Promise<UserProfile> {
    if (profile.id) {
      const updatedProfile = await this.prisma.userProfile.update({
        where: {
          id: profile.id,
        },
        data: {
          userId: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          residenceMunicipalityId: profile.residenceMunicipalityId,
        },
      });

      return UserProfileMapper.toDomain(updatedProfile);
    }

    const createdProfile = await this.prisma.userProfile.create({
      data: {
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        residenceMunicipalityId: profile.residenceMunicipalityId,
      },
    });

    return UserProfileMapper.toDomain(createdProfile);
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      return null;
    }

    return UserProfileMapper.toDomain(profile);
  }
}