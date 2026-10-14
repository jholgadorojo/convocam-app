
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserTerritorialPreferenceRepository } from "../../adapters/repositories/in-memory-user-territorial-preference.repository";

import type { TerritorialCatalogQueryRepository } from "../repositories/territorial-catalog-query.repository";

import { SaveUserTerritorialPreferences } from "./save-user-territorial-preferences";

describe("SaveUserTerritorialPreferences", () => {
  // ==========================================================
  // PREPARAR REPOSITORIOS
  // ==========================================================

  async function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const territorialPreferenceRepository =
      new InMemoryUserTerritorialPreferenceRepository();

    // Simulamos el catálogo territorial.
    const catalogRepository: TerritorialCatalogQueryRepository = {
      async allTerritoriesExist(selection) {
        return (
          selection.provinceIds.every((id) =>
            [1, 2].includes(id),
          ) &&
          selection.countyIds.every((id) =>
            [10, 11].includes(id),
          ) &&
          selection.municipalityIds.every((id) =>
            [100, 101].includes(id),
          )
        );
      },
    };

    const profile = await userProfileRepository.save(
      UserProfile.create({
        userId: "user-1",
        firstName: "Ana",
        lastName: "García",
      }),
    );

    const useCase = new SaveUserTerritorialPreferences(
      userProfileRepository,
      territorialPreferenceRepository,
      catalogRepository,
    );

    return {
      profile,
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    };
  }

  // ==========================================================
  // TEST 1 — TODA CATALUNYA
  // ==========================================================

  it("guarda la preferencia Toda Catalunya", async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      userId: "user-1",
      scope: "ALL_CATALONIA",
      provinceIds: [],
      countyIds: [],
      municipalityIds: [],
    });

    expect(result.id).toBeDefined();
    expect(result.scope).toBe("ALL_CATALONIA");
    expect(result.provinceIds).toEqual([]);
  });

  // ==========================================================
  // TEST 2 — TERRITORIOS COMBINADOS
  // ==========================================================

  it("guarda provincias, comarcas y municipios", async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [1],
      countyIds: [10],
      municipalityIds: [100],
    });

    expect(result.scope).toBe(
      "SELECTED_TERRITORIES",
    );

    expect(result.provinceIds).toEqual([1]);
    expect(result.countyIds).toEqual([10]);
    expect(result.municipalityIds).toEqual([100]);
  });

  // ==========================================================
  // TEST 3 — ACTUALIZAR CONFIGURACIÓN
  // ==========================================================

  it("actualiza las preferencias conservando su identificador", async () => {
    const { useCase } = await setup();

    const first = await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [1],
      countyIds: [],
      municipalityIds: [],
    });

    const updated = await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [2],
      countyIds: [11],
      municipalityIds: [],
    });

    expect(updated.id).toBe(first.id);
    expect(updated.provinceIds).toEqual([2]);
    expect(updated.countyIds).toEqual([11]);
  });

  // ==========================================================
  // TEST 4 — CAMBIAR A TODA CATALUNYA
  // ==========================================================

  it("elimina los territorios al elegir Toda Catalunya", async () => {
    const { useCase } = await setup();

    await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [1],
      countyIds: [10],
      municipalityIds: [100],
    });

    const result = await useCase.execute({
      userId: "user-1",
      scope: "ALL_CATALONIA",
      provinceIds: [],
      countyIds: [],
      municipalityIds: [],
    });

    expect(result.scope).toBe("ALL_CATALONIA");
    expect(result.provinceIds).toEqual([]);
    expect(result.countyIds).toEqual([]);
    expect(result.municipalityIds).toEqual([]);
  });

  // ==========================================================
  // TEST 5 — TERRITORIO INEXISTENTE
  // ==========================================================

  it("rechaza un municipio inexistente", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        scope: "SELECTED_TERRITORIES",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [999],
      }),
    ).rejects.toThrow(
      "Uno o varios territorios no existen en el catálogo",
    );
  });

  // ==========================================================
  // TEST 6 — SELECCIÓN VACÍA
  // ==========================================================

  it("rechaza una selección de territorios vacía", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "user-1",
        scope: "SELECTED_TERRITORIES",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      }),
    ).rejects.toThrow(
      "Debes seleccionar al menos un territorio",
    );
  });

  // ==========================================================
  // TEST 7 — ELIMINAR DUPLICADOS
  // ==========================================================

  it("elimina territorios duplicados", async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [1, 1, 2],
      countyIds: [10, 10],
      municipalityIds: [],
    });

    expect(result.provinceIds).toEqual([1, 2]);
    expect(result.countyIds).toEqual([10]);
  });

  // ==========================================================
  // TEST 8 — NO MODIFICAR SI HAY UN ERROR
  // ==========================================================

  it("conserva las preferencias anteriores si falla la validación", async () => {
    const {
      profile,
      territorialPreferenceRepository,
      useCase,
    } = await setup();

    await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [1],
      countyIds: [],
      municipalityIds: [],
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        scope: "SELECTED_TERRITORIES",
        provinceIds: [999],
        countyIds: [],
        municipalityIds: [],
      }),
    ).rejects.toThrow();

    const stored =
      await territorialPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored?.provinceIds).toEqual([1]);
  });

  // ==========================================================
  // TEST 9 — USUARIO SIN PERFIL
  // ==========================================================

  it("rechaza un usuario sin perfil", async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      }),
    ).rejects.toThrow(
      "El usuario no tiene un perfil",
    );
  });

  // ==========================================================
  // TEST 10 — NO MEZCLAR USUARIOS
  // ==========================================================

  it("mantiene independientes las preferencias de dos usuarios", async () => {
    const {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    } = await setup();

    const secondProfile =
      await userProfileRepository.save(
        UserProfile.create({
          userId: "user-2",
          firstName: "Pedro",
          lastName: "López",
        }),
      );

    await useCase.execute({
      userId: "user-1",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [1],
      countyIds: [],
      municipalityIds: [],
    });

    await useCase.execute({
      userId: "user-2",
      scope: "SELECTED_TERRITORIES",
      provinceIds: [],
      countyIds: [11],
      municipalityIds: [],
    });

    const second =
      await territorialPreferenceRepository
        .findByUserProfileId(secondProfile.id!);

    expect(second?.provinceIds).toEqual([]);
    expect(second?.countyIds).toEqual([11]);
  });
});
