
import type { UserProfessionalPreferenceRepository } from "../../application/repositories/user-professional-preference.repository";

import { UserProfessionalPreference } from "../../domain/user-professional-preference";

// ============================================================
// REPOSITORIO EN MEMORIA DE PREFERENCIAS PROFESIONALES
// ============================================================

export class InMemoryUserProfessionalPreferenceRepository
  implements UserProfessionalPreferenceRepository
{
  private readonly preferences = new Map<
    number,
    UserProfessionalPreference
  >();

  private nextId = 1;

  // ==========================================================
  // CONSULTAR PREFERENCIAS DE UN PERFIL
  // ==========================================================

  async findByUserProfileId(
    userProfileId: number,
  ): Promise<UserProfessionalPreference | null> {
    const preference = this.preferences.get(userProfileId);

    if (!preference || preference.id === undefined) {
      return null;
    }

    // Devolvemos una copia para evitar que los cambios
    // se guarden automáticamente sin ejecutar save().
    return this.copyWithId(
      preference,
      preference.id,
    );
  }

  // ==========================================================
  // CREAR O ACTUALIZAR PREFERENCIAS
  // ==========================================================

  async save(
    preference: UserProfessionalPreference,
  ): Promise<UserProfessionalPreference> {
    const existing = this.preferences.get(
      preference.userProfileId,
    );

    // Si ya existe una configuración, no permitimos
    // modificarla utilizando otro identificador.
    if (
      existing &&
      preference.id !== undefined &&
      existing.id !== preference.id
    ) {
      throw new Error(
        "Las preferencias no pertenecen al perfil indicado",
      );
    }

    // No permitimos guardar una configuración
    // con identificador si no existe previamente
    // para este perfil.
    if (
      !existing &&
      preference.id !== undefined
    ) {
      throw new Error(
        "Las preferencias profesionales no existen",
      );
    }

    // Conservar el identificador existente.
    // Asignar uno nuevo solo cuando sea necesario.
    const id = existing?.id ?? this.nextId;

    const saved = this.copyWithId(
      preference,
      id,
    );

    if (!existing) {
      this.nextId += 1;
    }

    // Sustituir la configuración completa.
    this.preferences.set(
      preference.userProfileId,
      saved,
    );

    // Devolver otra copia independiente.
    return this.copyWithId(saved, id);
  }

  // ==========================================================
  // ELIMINAR PREFERENCIAS
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
    preference: UserProfessionalPreference,
    id: number,
  ): UserProfessionalPreference {
    return UserProfessionalPreference.restore({
      id,
      userProfileId: preference.userProfileId,
      selectionProcessType:
        preference.selectionProcessType,
      subjectAreaIds: preference.subjectAreaIds,
      qualificationGroups: preference.qualificationGroups,
    });
  }
}
