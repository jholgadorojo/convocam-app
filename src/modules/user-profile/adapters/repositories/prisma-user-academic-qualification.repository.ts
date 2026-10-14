
import type { PrismaClient } from "@/generated/prisma/client";

import type { UserAcademicQualificationRepository } from "../../application/repositories/user-academic-qualification.repository";

import {
    UserAcademicQualification,
    type AcademicQualificationType,
} from "../../domain/user-academic-qualification";

// ============================================================
// TIPO DE DATOS RECUPERADOS DE PRISMA
// ============================================================

type AcademicQualificationRecord = {
    id: number;
    userProfileId: number;
    qualificationType: AcademicQualificationType;
    name: string;
};

// ============================================================
// REPOSITORIO PRISMA
// ============================================================

export class PrismaUserAcademicQualificationRepository
    implements UserAcademicQualificationRepository {
    constructor(
        private readonly prisma: PrismaClient,
    ) { }

    // ==========================================================
    // LISTAR TITULACIONES DE UN PERFIL
    // ==========================================================

    async listByUserProfileId(
        userProfileId: number,
    ): Promise<UserAcademicQualification[]> {
        const records =
            await this.prisma.userAcademicQualification.findMany({
                where: {
                    userProfileId,
                },
                orderBy: {
                    id: "asc",
                },
            });

        return records.map((record) =>
            this.toDomain(record),
        );
    }

    // ==========================================================
    // OBTENER UNA TITULACIÓN DE UN PERFIL
    // ==========================================================

    async findByIdAndUserProfileId(
        id: number,
        userProfileId: number,
    ): Promise<UserAcademicQualification | null> {
        const record =
            await this.prisma.userAcademicQualification.findFirst({
                where: {
                    id,
                    userProfileId,
                },
            });

        if (!record) {
            return null;
        }

        return this.toDomain(record);
    }

    // ==========================================================
    // CREAR O ACTUALIZAR UNA TITULACIÓN
    // ==========================================================

    async save(
        qualification: UserAcademicQualification,
    ): Promise<UserAcademicQualification> {
        // CREAR
        if (qualification.id === undefined) {
            const record =
                await this.prisma.userAcademicQualification.create({
                    data: {
                        userProfileId: qualification.userProfileId,
                        qualificationType:
                            qualification.qualificationType,
                        name: qualification.name,
                    },
                });

            return this.toDomain(record);
        }

        // ACTUALIZAR
        const record =
            await this.prisma.userAcademicQualification.update({
                where: {
                    id: qualification.id,
                    userProfileId: qualification.userProfileId,
                },
                data: {
                    qualificationType:
                        qualification.qualificationType,
                    name: qualification.name,
                },
            });

        return this.toDomain(record);
    }

    // ==========================================================
    // ELIMINAR UNA TITULACIÓN DE UN PERFIL
    // ==========================================================

    async deleteByIdAndUserProfileId(
        id: number,
        userProfileId: number,
    ): Promise<boolean> {
        const result =
            await this.prisma.userAcademicQualification.deleteMany({
                where: {
                    id,
                    userProfileId,
                },
            });

        return result.count > 0;
    }

    // ==========================================================
    // CONVERTIR REGISTRO PRISMA A ENTIDAD DE DOMINIO
    // ==========================================================

    private toDomain(
        record: AcademicQualificationRecord,
    ): UserAcademicQualification {
        return UserAcademicQualification.restore({
            id: record.id,
            userProfileId: record.userProfileId,
            qualificationType: record.qualificationType,
            name: record.name,
        });
    }
}
