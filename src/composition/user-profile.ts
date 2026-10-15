
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

import { PrismaUserTerritorialPreferenceRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-territorial-preference.repository";
import { PrismaTerritorialCatalogQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-territorial-catalog-query.repository";
import { GetUserTerritorialPreferences } from "@/modules/user-profile/application/use-cases/get-user-territorial-preferences";
import { SaveUserTerritorialPreferences } from "@/modules/user-profile/application/use-cases/save-user-territorial-preferences";
import { DeleteUserTerritorialPreferences } from "@/modules/user-profile/application/use-cases/delete-user-territorial-preferences";

import { prisma } from "@/shared/infrastructure/database/prisma";
import { PrismaUserAcademicQualificationRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-academic-qualification.repository";
import { PrismaTerritorialPreferenceOptionsQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-territorial-preference-options-query.repository";
import { GetTerritorialPreferenceOptions } from "@/modules/user-profile/application/use-cases/get-territorial-preference-options";

import { PrismaUserProfessionalPreferenceRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-professional-preference.repository";

import { PrismaProfessionalPreferenceCatalogQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-professional-preference-catalog-query.repository";

import { PrismaProfessionalPreferenceOptionsQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-professional-preference-options-query.repository";

import { GetUserProfessionalPreferences } from "@/modules/user-profile/application/use-cases/get-user-professional-preferences";

import { SaveUserProfessionalPreferences } from "@/modules/user-profile/application/use-cases/save-user-professional-preferences";

import { DeleteUserProfessionalPreferences } from "@/modules/user-profile/application/use-cases/delete-user-professional-preferences";

import { GetProfessionalPreferenceOptions } from "@/modules/user-profile/application/use-cases/get-professional-preference-options";


// ============================================================
// REPOSITORIOS
// ============================================================

const userProfileRepository =
  new PrismaUserProfileRepository(prisma);

const municipalityQueryRepository =
  new PrismaMunicipalityQueryRepository(prisma);

const userPersonalDataUnitOfWork =
  new PrismaUserPersonalDataUnitOfWork(prisma);

const userTerritorialPreferenceRepository =
  new PrismaUserTerritorialPreferenceRepository(prisma);

const territorialCatalogQueryRepository =
  new PrismaTerritorialCatalogQueryRepository(prisma);


const professionalPreferenceRepository =
  new PrismaUserProfessionalPreferenceRepository(
    prisma,
  );

const professionalPreferenceCatalogRepository =
  new PrismaProfessionalPreferenceCatalogQueryRepository(
    prisma,
  );

const professionalPreferenceOptionsRepository =
  new PrismaProfessionalPreferenceOptionsQueryRepository(
    prisma,
  );



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


// ============================================================
// PREFERENCIAS TERRITORIALES
// ============================================================

export const getUserTerritorialPreferencesUseCase =
  new GetUserTerritorialPreferences(
    userProfileRepository,
    userTerritorialPreferenceRepository,
  );

export const saveUserTerritorialPreferencesUseCase =
  new SaveUserTerritorialPreferences(
    userProfileRepository,
    userTerritorialPreferenceRepository,
    territorialCatalogQueryRepository,
  );

export const deleteUserTerritorialPreferencesUseCase =
  new DeleteUserTerritorialPreferences(
    userProfileRepository,
    userTerritorialPreferenceRepository,
  );

// ============================================================
// OPCIONES PARA PREFERENCIAS TERRITORIALES
// ============================================================

const territorialPreferenceOptionsQueryRepository =
  new PrismaTerritorialPreferenceOptionsQueryRepository(
    prisma,
  );

export const getTerritorialPreferenceOptionsUseCase =
  new GetTerritorialPreferenceOptions(
    territorialPreferenceOptionsQueryRepository,
  );

// ============================================================
// PREFERENCIAS PROFESIONALES
// ============================================================

// Consultar preferencias guardadas.
export const getUserProfessionalPreferencesUseCase =
  new GetUserProfessionalPreferences(
    userProfileRepository,
    professionalPreferenceRepository,
  );

// Guardar o modificar preferencias.
export const saveUserProfessionalPreferencesUseCase =
  new SaveUserProfessionalPreferences(
    userProfileRepository,
    professionalPreferenceRepository,
    professionalPreferenceCatalogRepository,
  );

// Eliminar preferencias.
export const deleteUserProfessionalPreferencesUseCase =
  new DeleteUserProfessionalPreferences(
    userProfileRepository,
    professionalPreferenceRepository,
  );

// Obtener materias y grupos disponibles en CIDO.
export const getProfessionalPreferenceOptionsUseCase =
  new GetProfessionalPreferenceOptions(
    professionalPreferenceOptionsRepository,
  );

