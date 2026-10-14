
import { CreateUserProfile } from "@/modules/user-profile/application/use-cases/create-user-profile";
import { GetUserProfile } from "@/modules/user-profile/application/use-cases/get-user-profile";
import { ChangeUserProfileResidence } from "@/modules/user-profile/application/use-cases/change-user-profile-residence";
import { ChangeUserProfilePersonalData } from "@/modules/user-profile/application/use-cases/change-user-profile-personal-data";
import { ListMunicipalities } from "@/modules/user-profile/application/use-cases/list-municipalities";

import { PrismaUserProfileRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-profile.repository";
import { PrismaMunicipalityQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-municipality-query.repository";
import { PrismaUserPersonalDataUnitOfWork } from "@/modules/user-profile/adapters/repositories/prisma-user-personal-data-unit-of-work";
import { EnsureUserProfile } from "@/modules/user-profile/application/use-cases/ensure-user-profile";

import { AddUserAcademicQualification } from "@/modules/user-profile/application/use-cases/add-user-academic-qualification";
import { ListUserAcademicQualifications } from "@/modules/user-profile/application/use-cases/list-user-academic-qualifications";
import { UpdateUserAcademicQualification } from "@/modules/user-profile/application/use-cases/update-user-academic-qualification";
import { DeleteUserAcademicQualification } from "@/modules/user-profile/application/use-cases/delete-user-academic-qualification";

import { prisma } from "@/shared/infrastructure/database/prisma";

import { PrismaUserAcademicQualificationRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-academic-qualification.repository";


// ============================================================
// REPOSITORIOS
// ============================================================

const userProfileRepository =
  new PrismaUserProfileRepository(prisma);

const municipalityQueryRepository =
  new PrismaMunicipalityQueryRepository(prisma);

const userPersonalDataUnitOfWork =
  new PrismaUserPersonalDataUnitOfWork(prisma);

// ============================================================
// CASOS DE USO
// ============================================================

export const createUserProfileUseCase =
  new CreateUserProfile(userProfileRepository);

export const getUserProfileUseCase =
  new GetUserProfile(userProfileRepository);

export const changeUserProfilePersonalDataUseCase =
  new ChangeUserProfilePersonalData(
    userProfileRepository,
    userPersonalDataUnitOfWork,
  );

export const changeUserProfileResidenceUseCase =
  new ChangeUserProfileResidence(
    userProfileRepository,
    municipalityQueryRepository,
  );

export const listMunicipalitiesUseCase =
  new ListMunicipalities(municipalityQueryRepository);

export const ensureUserProfileUseCase =
  new EnsureUserProfile(userProfileRepository);


// ============================================================
// FORMACIÓN ACADÉMICA — REPOSITORIO
// ============================================================

const academicQualificationRepository =
  new PrismaUserAcademicQualificationRepository(prisma);

// ============================================================
// FORMACIÓN ACADÉMICA — CASOS DE USO
// ============================================================

// Añadir titulación
export const addUserAcademicQualificationUseCase =
  new AddUserAcademicQualification(
    userProfileRepository,
    academicQualificationRepository,
  );

// Consultar titulaciones
export const listUserAcademicQualificationsUseCase =
  new ListUserAcademicQualifications(
    userProfileRepository,
    academicQualificationRepository,
  );

// Modificar titulación
export const updateUserAcademicQualificationUseCase =
  new UpdateUserAcademicQualification(
    userProfileRepository,
    academicQualificationRepository,
  );

// Eliminar titulación
export const deleteUserAcademicQualificationUseCase =
  new DeleteUserAcademicQualification(
    userProfileRepository,
    academicQualificationRepository,
  );
