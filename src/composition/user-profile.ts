import { CreateUserProfile } from "@/modules/user-profile/application/use-cases/create-user-profile";
import { GetUserProfile } from "@/modules/user-profile/application/use-cases/get-user-profile";
import { PrismaUserProfileRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-profile.repository";
import { prisma } from "@/shared/infrastructure/database/prisma";

const userProfileRepository =
  new PrismaUserProfileRepository(prisma);

export const createUserProfileUseCase =
  new CreateUserProfile(userProfileRepository);

export const getUserProfileUseCase =
  new GetUserProfile(userProfileRepository);