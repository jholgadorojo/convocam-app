
import type { PrismaClient } from "@/generated/prisma/client";

import type { UserProfessionalPreferenceRepository } from "../../application/repositories/user-professional-preference.repository";

import {
  UserProfessionalPreference,
  type PreferredSelectionProcessType,
} from "../../domain/user-professional-preference";

// ============================================================
// DATOS RECUPERADOS DE PRISMA
// ============================================================

type ProfessionalPreferenceRecord = {
  id: number;
  userProfileId: number;
  selectionProcessType: PreferredSelectionProcessType | null;
  subjectAreas: {
    subjectAreaId: number;
  }[];
  qualificationGroups: {
    qualificationGroup: string;
  }[];
};

// ============================================================
// RELACIONES QUE NECESITAMOS CONSULTAR
// ============================================================

const preferenceInclude = {
  subjectAreas: {
    select: {
      subjectAreaId: true,
    },
    orderBy: {
      subjectAreaId: "asc",
    },
  },
  qualificationGroups: {
    select: {
      qualificationGroup: true,
    },
    orderBy: {
      qualificationGroup: "asc",
    },
  },
} as const;

// ============================================================
// REPOSITORIO PRISMA
// ============================================================

export class PrismaUserProfessionalPreferenceRepository
  implements UserProfessionalPreferenceRepository
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  // ==========================================================
  // CONSULTAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  async findByUserProfileId(
    userProfileId: number,
  ): Promise<UserProfessionalPreference | null> {
    const record =
      await this.prisma.userProfessionalPreference.findUnique({
        where: {
          userProfileId,
        },
        include: preferenceInclude,
      });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  // ==========================================================
  // CREAR O ACTUALIZAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  async save(
    preference: UserProfessionalPreference,
  ): Promise<UserProfessionalPreference> {
    return this.prisma.$transaction(async (tx) => {
      // ------------------------------------------------------
      // 1. COMPROBAR CONFIGURACIÓN EXISTENTE
      // ------------------------------------------------------

      const existing =
        await tx.userProfessionalPreference.findUnique({
          where: {
            userProfileId: preference.userProfileId,
          },
          select: {
            id: true,
          },
        });

      // No actualizar un identificador inexistente.
      if (
        !existing &&
        preference.id !== undefined
      ) {
        throw new Error(
          "Las preferencias profesionales no existen",
        );
      }

      // No utilizar el identificador de otra configuración.
      if (
        existing &&
        preference.id !== undefined &&
        existing.id !== preference.id
      ) {
        throw new Error(
          "Las preferencias no pertenecen al perfil indicado",
        );
      }

      // ------------------------------------------------------
      // 2. CREAR O ACTUALIZAR CONFIGURACIÓN PRINCIPAL
      // ------------------------------------------------------

      const record =
        await tx.userProfessionalPreference.upsert({
          where: {
            userProfileId: preference.userProfileId,
          },
          create: {
            userProfileId: preference.userProfileId,
            selectionProcessType:
              preference.selectionProcessType,
          },
          update: {
            selectionProcessType:
              preference.selectionProcessType,
          },
        });

      // ------------------------------------------------------
      // 3. ELIMINAR RELACIONES ANTERIORES
      // ------------------------------------------------------

      await tx.userPreferredSubjectArea.deleteMany({
        where: {
          professionalPreferenceId: record.id,
        },
      });

      await tx.userPreferredQualificationGroup.deleteMany({
        where: {
          professionalPreferenceId: record.id,
        },
      });

      // ------------------------------------------------------
      // 4. GUARDAR ÁREAS Y MATERIAS PROFESIONALES
      // ------------------------------------------------------

      if (preference.subjectAreaIds.length > 0) {
        await tx.userPreferredSubjectArea.createMany({
          data: preference.subjectAreaIds.map(
            (subjectAreaId) => ({
              professionalPreferenceId: record.id,
              subjectAreaId,
            }),
          ),
        });
      }

      // ------------------------------------------------------
      // 5. GUARDAR GRUPOS DE TITULACIÓN
      // ------------------------------------------------------

      if (preference.qualificationGroups.length > 0) {
        await tx.userPreferredQualificationGroup.createMany({
          data: preference.qualificationGroups.map(
            (qualificationGroup) => ({
              professionalPreferenceId: record.id,
              qualificationGroup,
            }),
          ),
        });
      }

      // ------------------------------------------------------
      // 6. RECUPERAR CONFIGURACIÓN GUARDADA
      // ------------------------------------------------------

      const saved =
        await tx.userProfessionalPreference.findUniqueOrThrow({
          where: {
            id: record.id,
          },
          include: preferenceInclude,
        });

      // ------------------------------------------------------
      // 7. DEVOLVER ENTIDAD DE DOMINIO
      // ------------------------------------------------------

      return this.toDomain(saved);
    });
  }

  // ==========================================================
  // ELIMINAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  async deleteByUserProfileId(
    userProfileId: number,
  ): Promise<boolean> {
    const result =
      await this.prisma.userProfessionalPreference.deleteMany({
        where: {
          userProfileId,
        },
      });

    return result.count > 0;
  }

  // ==========================================================
  // CONVERTIR REGISTRO PRISMA A ENTIDAD DE DOMINIO
  // ==========================================================

  private toDomain(
    record: ProfessionalPreferenceRecord,
  ): UserProfessionalPreference {
    return UserProfessionalPreference.restore({
      id: record.id,
      userProfileId: record.userProfileId,

      selectionProcessType:
        record.selectionProcessType,

      subjectAreaIds: record.subjectAreas.map(
        (item) => item.subjectAreaId,
      ),

      qualificationGroups:
        record.qualificationGroups.map(
          (item) => item.qualificationGroup,
        ),
    });
  }
}
