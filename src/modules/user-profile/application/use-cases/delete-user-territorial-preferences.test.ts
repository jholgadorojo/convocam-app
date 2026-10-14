
import {
  describe,
  expect,
  it,
} from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { UserTerritorialPreference } from "../../domain/user-territorial-preference";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserTerritorialPreferenceRepository } from "../../adapters/repositories/in-memory-user-territorial-preference.repository";

import { DeleteUserTerritorialPreferences } from "./delete-user-territorial-preferences";

describe("DeleteUserTerritorialPreferences", () => {
  // ==========================================================
  // PREPARAR REPOSITORIOS
  // ==========================================================

  function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const territorialPreferenceRepository =
      new InMemoryUserTerritorialPreferenceRepository();

    const useCase = new DeleteUserTerritorialPreferences(
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
  // TEST 1 — ELIMINAR TERRITORIOS SELECCIONADOS
  // ==========================================================

  it("elimina las preferencias territoriales", async () => {
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
          provinceIds: [1],
          countyIds: [5],
          municipalityIds: [20],
        },
      ),
    );

    const deleted = await useCase.execute({
      userId: "user-1",
    });

    expect(deleted).toBe(true);

    const result =
      await territorialPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 2 — ELIMINAR TODA CATALUNYA
  // ==========================================================

  it("elimina una configuración de Toda Catalunya", async () => {
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

    const deleted = await useCase.execute({
      userId: "user-1",
    });

    expect(deleted).toBe(true);

    const result =
      await territorialPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 3 — SIN PREFERENCIAS
  // ==========================================================

  it("devuelve false cuando no hay preferencias", async () => {
    const {
      userProfileRepository,
      useCase,
    } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const deleted = await useCase.execute({
      userId: "user-1",
    });

    expect(deleted).toBe(false);
  });

  // ==========================================================
  // TEST 4 — ELIMINACIÓN REPETIDA
  // ==========================================================

  it("permite repetir la eliminación sin errores", async () => {
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

    const first = await useCase.execute({
      userId: "user-1",
    });

    const second = await useCase.execute({
      userId: "user-1",
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  // ==========================================================
  // TEST 5 — NO AFECTAR A OTRO OPOSITOR
  // ==========================================================

  it("no elimina las preferencias de otro usuario", async () => {
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

    await useCase.execute({
      userId: "user-1",
    });

    const first =
      await territorialPreferenceRepository
        .findByUserProfileId(profileA.id!);

    const second =
      await territorialPreferenceRepository
        .findByUserProfileId(profileB.id!);

    expect(first).toBeNull();
    expect(second?.countyIds).toEqual([8]);
  });

  // ==========================================================
  // TEST 6 — USUARIO SIN PERFIL
  // ==========================================================

  it("rechaza un usuario que no tiene perfil", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
      }),
    ).rejects.toThrow(
      "El usuario no tiene un perfil",
    );
  });

  // ==========================================================
  // TEST 7 — CONFIGURAR DE NUEVO
  // ==========================================================

  it("permite configurar nuevas preferencias después de eliminarlas", async () => {
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

    await useCase.execute({
      userId: "user-1",
    });

    const newPreference =
      await territorialPreferenceRepository.save(
        UserTerritorialPreference.createSelectedTerritories(
          profile.id!,
          {
            provinceIds: [2],
            countyIds: [],
            municipalityIds: [30],
          },
        ),
      );

    expect(newPreference.scope).toBe(
      "SELECTED_TERRITORIES",
    );

    expect(newPreference.provinceIds).toEqual([2]);
    expect(newPreference.municipalityIds).toEqual([30]);
  });

  // ==========================================================
  // TEST 8 — USUARIO SIN PREFERENCIAS
  // ==========================================================

  it("no afecta a otros usuarios si el solicitante no tiene preferencias", async () => {
    const {
      userProfileRepository,
      territorialPreferenceRepository,
      useCase,
    } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const profileB = await createProfile(
      userProfileRepository,
      "user-2",
    );

    await territorialPreferenceRepository.save(
      UserTerritorialPreference.createAllCatalonia(
        profileB.id!,
      ),
    );

    const deleted = await useCase.execute({
      userId: "user-1",
    });

    expect(deleted).toBe(false);

    const otherPreference =
      await territorialPreferenceRepository
        .findByUserProfileId(profileB.id!);

    expect(otherPreference?.scope).toBe(
      "ALL_CATALONIA",
    );
  });
});
