import { CreateUserProfile } from "@/modules/user-profile/application/use-cases/create-user-profile";
import { GetUserProfile } from "@/modules/user-profile/application/use-cases/get-user-profile";
import { ChangeUserProfileResidence } from "@/modules/user-profile/application/use-cases/change-user-profile-residence";
import { ListMunicipalities } from "@/modules/user-profile/application/use-cases/list-municipalities";

import { PrismaUserProfileRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-profile.repository";
import { PrismaMunicipalityQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-municipality-query.repository";

import { prisma } from "@/shared/infrastructure/database/prisma";

// Repositorios
const userProfileRepository =
  new PrismaUserProfileRepository(prisma);

const municipalityQueryRepository =
  new PrismaMunicipalityQueryRepository(prisma);

// Casos de uso
export const createUserProfileUseCase =
  new CreateUserProfile(userProfileRepository);

export const getUserProfileUseCase =
  new GetUserProfile(userProfileRepository);

export const changeUserProfileResidenceUseCase =
  new ChangeUserProfileResidence(
    userProfileRepository,
    municipalityQueryRepository,
  );

export const listMunicipalitiesUseCase =
  new ListMunicipalities(municipalityQueryRepository);