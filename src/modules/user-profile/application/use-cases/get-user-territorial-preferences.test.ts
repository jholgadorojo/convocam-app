
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { UserTerritorialPreference } from "../../domain/user-territorial-preference";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserTerritorialPreferenceRepository } from "../../adapters/repositories/in-memory-user-territorial-preference.repository";

import { GetUserTerritorialPreferences } from "./get-user-territorial-preferences";

describe("GetUserTerritorialPreferences", () => {
  // ==========================================================
  // PREPARAR REPOSITORIOS
  // ==========================================================

  function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const territorialPreferenceRepository =
      new InMemoryUserTerritorialPreferenceRepository();

    const useCase = new GetUserTerritorialPreferences(
      userProfileRepository,
      territorialPreferenceRepository,
    );

    return {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    };
  }

  async function createProfile(
    repository: InMemoryUserProfileRepository,
    userId: string,
  ) {
    return repository.save(
      UserProfile.create({
        userId,
        firstName: "Usuario",
        lastName: "Prueba",
      }),
    );
  }

  // ==========================================================
  // TEST 1 — SIN PERFIL
  // ==========================================================

  it("devuelve null si el usuario no tiene perfil", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: "usuario-inexistente",
    });

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 2 — SIN PREFERENCIAS
  // ==========================================================

  it("devuelve null si no ha configurado preferencias", async () => {
    const { userProfileRepository, useCase } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 3 — TODA CATALUNYA
  // ==========================================================

  it("devuelve una configuración para toda Catalunya", async () => {
    const {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await territorialPreferenceRepository.save(
      UserTerritorialPreference.createAllCatalonia(
        profile.id!,
      ),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual({
      id: 1,
      scope: "ALL_CATALONIA",
      provinceIds: [],
      countyIds: [],
      municipalityIds: [],
    });
  });

  // ==========================================================
  // TEST 4 — TERRITORIOS COMBINADOS
  // ==========================================================

  it("devuelve provincias, comarcas y municipios", async () => {
    const {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await territorialPreferenceRepository.save(
      UserTerritorialPreference.createSelectedTerritories(
        profile.id!,
        {
          provinceIds: [1, 2],
          countyIds: [5],
          municipalityIds: [20, 30],
        },
      ),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.scope).toBe(
      "SELECTED_TERRITORIES",
    );

    expect(result?.provinceIds).toEqual([1, 2]);
    expect(result?.countyIds).toEqual([5]);
    expect(result?.municipalityIds).toEqual([20, 30]);
  });

  // ==========================================================
  // TEST 5 — AISLAMIENTO ENTRE USUARIOS
  // ==========================================================

  it("no devuelve preferencias de otro usuario", async () => {
    const {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    } = setup();

    const profileA = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const profileB = await createProfile(
      userProfileRepository,
      "user-2",
    );

    await territorialPreferenceRepository.save(
      UserTerritorialPreference.createSelectedTerritories(
        profileA.id!,
        {
          provinceIds: [1],
          countyIds: [],
          municipalityIds: [],
        },
      ),
    );

    await territorialPreferenceRepository.save(
      UserTerritorialPreference.createSelectedTerritories(
        profileB.id!,
        {
          provinceIds: [],
          countyIds: [8],
          municipalityIds: [],
        },
      ),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.provinceIds).toEqual([1]);
    expect(result?.countyIds).toEqual([]);
    expect(result?.municipalityIds).toEqual([]);
  });

  // ==========================================================
  // TEST 6 — CONSULTAR DESPUÉS DE MODIFICAR
  // ==========================================================

  it("devuelve las preferencias actualizadas", async () => {
    const {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const preference =
      await territorialPreferenceRepository.save(
        UserTerritorialPreference.createAllCatalonia(
          profile.id!,
        ),
      );

    preference.selectTerritories({
      provinceIds: [],
      countyIds: [5],
      municipalityIds: [20],
    });

    await territorialPreferenceRepository.save(
      preference,
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.scope).toBe(
      "SELECTED_TERRITORIES",
    );

    expect(result?.countyIds).toEqual([5]);
    expect(result?.municipalityIds).toEqual([20]);
  });
});
