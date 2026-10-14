
import type { PrismaClient } from "@/generated/prisma/client";

import type { UserTerritorialPreferenceRepository } from "../../application/repositories/user-territorial-preference.repository";

import {
    UserTerritorialPreference,
    type TerritorialPreferenceScope,
} from "../../domain/user-territorial-preference";

// ============================================================
// REGISTRO RECUPERADO DE PRISMA
// ============================================================

type TerritorialPreferenceRecord = {
    id: number;
    userProfileId: number;
    scope: TerritorialPreferenceScope;
    provinces: { provinceId: number }[];
    counties: { countyId: number }[];
    municipalities: { municipalityId: number }[];
};

// ============================================================
// REPOSITORIO PRISMA
// ============================================================

export class PrismaUserTerritorialPreferenceRepository
    implements UserTerritorialPreferenceRepository {
    constructor(
        private readonly prisma: PrismaClient,
    ) { }

    // ==========================================================
    // CONSULTAR PREFERENCIAS TERRITORIALES
    // ==========================================================

    async findByUserProfileId(
        userProfileId: number,
    ): Promise<UserTerritorialPreference | null> {
        const record =
            await this.prisma.userTerritorialPreference.findUnique({
                where: {
                    userProfileId,
                },
                include: {
                    provinces: {
                        select: {
                            provinceId: true,
                        },
                        orderBy: {
                            provinceId: "asc",
                        },
                    },
                    counties: {
                        select: {
                            countyId: true,
                        },
                        orderBy: {
                            countyId: "asc",
                        },
                    },
                    municipalities: {
                        select: {
                            municipalityId: true,
                        },
                        orderBy: {
                            municipalityId: "asc",
                        },
                    },
                },
            });

        if (!record) {
            return null;
        }

        return this.toDomain(record);
    }

    // ==========================================================
    // CREAR O ACTUALIZAR PREFERENCIAS TERRITORIALES
    // ==========================================================

    async save(
        preference: UserTerritorialPreference,
    ): Promise<UserTerritorialPreference> {
        return this.prisma.$transaction(async (tx) => {
            // ------------------------------------------------------
            // 1. COMPROBAR SI EXISTEN PREFERENCIAS
            // ------------------------------------------------------

            const existing =
                await tx.userTerritorialPreference.findUnique({
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
                    "Las preferencias territoriales no existen",
                );
            }

            // No permitir utilizar el identificador
            // de otra configuración.
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
            // 2. CREAR O ACTUALIZAR LA CONFIGURACIÓN PRINCIPAL
            // ------------------------------------------------------

            const record =
                await tx.userTerritorialPreference.upsert({
                    where: {
                        userProfileId: preference.userProfileId,
                    },
                    create: {
                        userProfileId: preference.userProfileId,
                        scope: preference.scope,
                    },
                    update: {
                        scope: preference.scope,
                    },
                });

            // ------------------------------------------------------
            // 3. ELIMINAR LAS RELACIONES ANTERIORES
            // ------------------------------------------------------

            await tx.userPreferredProvince.deleteMany({
                where: {
                    territorialPreferenceId: record.id,
                },
            });

            await tx.userPreferredCounty.deleteMany({
                where: {
                    territorialPreferenceId: record.id,
                },
            });

            await tx.userPreferredMunicipality.deleteMany({
                where: {
                    territorialPreferenceId: record.id,
                },
            });

            // ------------------------------------------------------
            // 4. GUARDAR LAS PROVINCIAS SELECCIONADAS
            // ------------------------------------------------------

            if (preference.provinceIds.length > 0) {
                await tx.userPreferredProvince.createMany({
                    data: preference.provinceIds.map(
                        (provinceId) => ({
                            territorialPreferenceId: record.id,
                            provinceId,
                        }),
                    ),
                });
            }

            // ------------------------------------------------------
            // 5. GUARDAR LAS COMARCAS SELECCIONADAS
            // ------------------------------------------------------

            if (preference.countyIds.length > 0) {
                await tx.userPreferredCounty.createMany({
                    data: preference.countyIds.map(
                        (countyId) => ({
                            territorialPreferenceId: record.id,
                            countyId,
                        }),
                    ),
                });
            }

            // ------------------------------------------------------
            // 6. GUARDAR LOS MUNICIPIOS SELECCIONADOS
            // ------------------------------------------------------

            if (preference.municipalityIds.length > 0) {
                await tx.userPreferredMunicipality.createMany({
                    data: preference.municipalityIds.map(
                        (municipalityId) => ({
                            territorialPreferenceId: record.id,
                            municipalityId,
                        }),
                    ),
                });
            }

            // ------------------------------------------------------
            // 7. RECUPERAR LA CONFIGURACIÓN GUARDADA
            // ------------------------------------------------------

            const saved =
                await tx.userTerritorialPreference.findUniqueOrThrow({
                    where: {
                        id: record.id,
                    },
                    include: {
                        provinces: {
                            select: {
                                provinceId: true,
                            },
                            orderBy: {
                                provinceId: "asc",
                            },
                        },
                        counties: {
                            select: {
                                countyId: true,
                            },
                            orderBy: {
                                countyId: "asc",
                            },
                        },
                        municipalities: {
                            select: {
                                municipalityId: true,
                            },
                            orderBy: {
                                municipalityId: "asc",
                            },
                        },
                    },
                });

            return this.toDomain(saved);
        });
    }

    // ==========================================================
    // ELIMINAR PREFERENCIAS TERRITORIALES
    // ==========================================================

    async deleteByUserProfileId(
        userProfileId: number,
    ): Promise<boolean> {
        const result =
            await this.prisma.userTerritorialPreference.deleteMany({
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
        record: TerritorialPreferenceRecord,
    ): UserTerritorialPreference {
        return UserTerritorialPreference.restore({
            id: record.id,
            userProfileId: record.userProfileId,
            scope: record.scope,

            provinceIds: record.provinces.map(
                (item) => item.provinceId,
            ),

            countyIds: record.counties.map(
                (item) => item.countyId,
            ),

            municipalityIds: record.municipalities.map(
                (item) => item.municipalityId,
            ),
        });
    }
}
