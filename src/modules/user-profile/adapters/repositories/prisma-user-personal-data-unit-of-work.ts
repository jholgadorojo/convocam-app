
import { PrismaClient } from "@/generated/prisma/client";

import { UserProfile } from "../../domain/user-profile";

import { UserPersonalDataUnitOfWork } from "../../application/repositories/user-personal-data-unit-of-work";

import { UserProfileMapper } from "../mappers/user-profile.mapper";

export class PrismaUserPersonalDataUnitOfWork
  implements UserPersonalDataUnitOfWork
{
  constructor(private readonly prisma: PrismaClient) {}

  async saveProfileAndUserName(
    profile: UserProfile,
  ): Promise<UserProfile> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear o actualizar el perfil personal

      const savedProfile =
        profile.id === undefined
          ? await tx.userProfile.create({
              data: {
                userId: profile.userId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                residenceMunicipalityId:
                  profile.residenceMunicipalityId,
              },
            })
          : await tx.userProfile.update({
              where: {
                id: profile.id,
                userId: profile.userId,
              },
              data: {
                firstName: profile.firstName,
                lastName: profile.lastName,
              },
            });

      // 2. Actualizar el nombre de Better Auth

      const fullName =
        `${profile.firstName} ${profile.lastName}`;

      await tx.user.update({
        where: {
          id: profile.userId,
        },
        data: {
          name: fullName,
        },
      });

      // 3. Devolver la entidad actualizada

      return UserProfileMapper.toDomain(savedProfile);
    });
  }
}
