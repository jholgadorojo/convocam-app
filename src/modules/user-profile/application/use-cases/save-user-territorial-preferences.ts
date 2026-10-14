
import { UserTerritorialPreference } from "../../domain/user-territorial-preference";

import type {
  SaveUserTerritorialPreferencesDto,
  UserTerritorialPreferenceDto,
} from "../dto/user-territorial-preference.dto";

import type { UserProfileRepository } from "../repositories/user-profile.repository";

import type { UserTerritorialPreferenceRepository } from "../repositories/user-territorial-preference.repository";

import type { TerritorialCatalogQueryRepository } from "../repositories/territorial-catalog-query.repository";

// ============================================================
// CASO DE USO: GUARDAR PREFERENCIAS TERRITORIALES
// ============================================================

export class SaveUserTerritorialPreferences {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly territorialPreferenceRepository: UserTerritorialPreferenceRepository,
    private readonly territorialCatalogQueryRepository: TerritorialCatalogQueryRepository,
  ) {}

  async execute(
    input: SaveUserTerritorialPreferencesDto,
  ): Promise<UserTerritorialPreferenceDto> {
    // --------------------------------------------------------
    // 1. RECUPERAR EL PERFIL DEL USUARIO
    // --------------------------------------------------------

    const profile =
      await this.userProfileRepository.findByUserId(
        input.userId,
      );

    if (!profile || profile.id === undefined) {
      throw new Error("El usuario no tiene un perfil");
    }

    // --------------------------------------------------------
    // 2. PREPARAR LA SELECCIÓN TERRITORIAL
    // --------------------------------------------------------

    const selection = {
      provinceIds: input.provinceIds,
      countyIds: input.countyIds,
      municipalityIds: input.municipalityIds,
    };

    let requestedPreference: UserTerritorialPreference;

    // --------------------------------------------------------
    // 3. VALIDAR EL ÁMBITO
    // --------------------------------------------------------

    if (input.scope === "ALL_CATALONIA") {
      // Toda Catalunya no debe tener selecciones concretas.
      if (
        selection.provinceIds.length > 0 ||
        selection.countyIds.length > 0 ||
        selection.municipalityIds.length > 0
      ) {
        throw new Error(
          "Toda Catalunya no puede tener territorios seleccionados",
        );
      }

      requestedPreference =
        UserTerritorialPreference.createAllCatalonia(
          profile.id,
        );
    } else if (
      input.scope === "SELECTED_TERRITORIES"
    ) {
      // El dominio valida identificadores, elimina
      // duplicados y rechaza una selección vacía.
      requestedPreference =
        UserTerritorialPreference.createSelectedTerritories(
          profile.id,
          selection,
        );

      // ------------------------------------------------------
      // 4. VALIDAR EXISTENCIA DE LOS TERRITORIOS
      // ------------------------------------------------------

      const allExist =
        await this.territorialCatalogQueryRepository
          .allTerritoriesExist({
            provinceIds: requestedPreference.provinceIds,
            countyIds: requestedPreference.countyIds,
            municipalityIds:
              requestedPreference.municipalityIds,
          });

      if (!allExist) {
        throw new Error(
          "Uno o varios territorios no existen en el catálogo",
        );
      }
    } else {
      throw new Error(
        "El ámbito territorial no es válido",
      );
    }

    // --------------------------------------------------------
    // 5. COMPROBAR SI YA EXISTEN PREFERENCIAS
    // --------------------------------------------------------

    const existing =
      await this.territorialPreferenceRepository
        .findByUserProfileId(profile.id);

    let preferenceToSave: UserTerritorialPreference;

    if (!existing) {
      // Primera configuración del usuario.
      preferenceToSave = requestedPreference;
    } else {
      // Modificar la configuración existente,
      // conservando su identificador.
      if (requestedPreference.scope === "ALL_CATALONIA") {
        existing.selectAllCatalonia();
      } else {
        existing.selectTerritories({
          provinceIds: requestedPreference.provinceIds,
          countyIds: requestedPreference.countyIds,
          municipalityIds:
            requestedPreference.municipalityIds,
        });
      }

      preferenceToSave = existing;
    }

    // --------------------------------------------------------
    // 6. GUARDAR LAS PREFERENCIAS
    // --------------------------------------------------------

    const saved =
      await this.territorialPreferenceRepository.save(
        preferenceToSave,
      );

    if (saved.id === undefined) {
      throw new Error(
        "No se han podido guardar las preferencias territoriales",
      );
    }

    // --------------------------------------------------------
    // 7. DEVOLVER RESULTADO
    // --------------------------------------------------------

    return {
      id: saved.id,
      scope: saved.scope,
      provinceIds: saved.provinceIds,
      countyIds: saved.countyIds,
      municipalityIds: saved.municipalityIds,
    };
  }
}
