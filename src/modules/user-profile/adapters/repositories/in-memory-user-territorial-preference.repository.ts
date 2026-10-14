
import type { UserTerritorialPreferenceRepository } from "../../application/repositories/user-territorial-preference.repository";

import { UserTerritorialPreference } from "../../domain/user-territorial-preference";

// ============================================================
// REPOSITORIO EN MEMORIA
// ============================================================

export class InMemoryUserTerritorialPreferenceRepository
    implements UserTerritorialPreferenceRepository {
    private readonly preferences = new Map<
        number,
        UserTerritorialPreference
    >();

    private nextId = 1;

    // ==========================================================
    // CONSULTAR PREFERENCIAS DE UN PERFIL
    // ==========================================================

    async findByUserProfileId(
        userProfileId: number,
    ): Promise<UserTerritorialPreference | null> {
        const preference = this.preferences.get(userProfileId);

        if (!preference || preference.id === undefined) {
            return null;
        }

        return this.copyWithId(
            preference,
            preference.id,
        );
    }

    // ==========================================================
    // CREAR O ACTUALIZAR PREFERENCIAS
    // ==========================================================

    async save(
        preference: UserTerritorialPreference,
    ): Promise<UserTerritorialPreference> {
        const existing = this.preferences.get(
            preference.userProfileId,
        );

        // Si existe una configuración, comprobar que
        // no se intenta utilizar otro identificador.
        if (
            existing &&
            preference.id !== undefined &&
            existing.id !== preference.id
        ) {
            throw new Error(
                "Las preferencias no pertenecen al perfil indicado",
            );
        }

        // No permitir actualizar un identificador
        // que no existe en el repositorio.
        if (
            !existing &&
            preference.id !== undefined
        ) {
            throw new Error(
                "Las preferencias territoriales no existen",
            );
        }

        // Si ya existe, conservamos su identificador.
        // Si es nueva, asignamos el siguiente disponible.
        const id = existing?.id ?? this.nextId;

        if (!existing) {
            this.nextId += 1;
        }

        const saved = this.copyWithId(
            preference,
            id,
        );

        // Sustituir la configuración completa.
        this.preferences.set(
            preference.userProfileId,
            saved,
        );

        // Devolver una copia independiente.
        return this.copyWithId(saved, id);
    }

    // ==========================================================
    // ELIMINAR PREFERENCIAS DE UN PERFIL
    // ==========================================================

    async deleteByUserProfileId(
        userProfileId: number,
    ): Promise<boolean> {
        return this.preferences.delete(userProfileId);
    }

    // ==========================================================
    // COPIAR ENTIDAD CON IDENTIFICADOR
    // ==========================================================

    private copyWithId(
        preference: UserTerritorialPreference,
        id: number,
    ): UserTerritorialPreference {
        return UserTerritorialPreference.restore({
            id,
            userProfileId: preference.userProfileId,
            scope: preference.scope,
            provinceIds: preference.provinceIds,
            countyIds: preference.countyIds,
            municipalityIds: preference.municipalityIds,
        });
    }
}
