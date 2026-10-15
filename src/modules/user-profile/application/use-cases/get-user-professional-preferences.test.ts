
import {
  describe,
  expect,
  it,
} from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { UserProfessionalPreference } from "../../domain/user-professional-preference";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserProfessionalPreferenceRepository } from "../../adapters/repositories/in-memory-user-professional-preference.repository";

import { GetUserProfessionalPreferences } from "./get-user-professional-preferences";

describe("GetUserProfessionalPreferences", () => {
  // ==========================================================
  // PREPARAR LOS REPOSITORIOS
  // ==========================================================

  function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const professionalPreferenceRepository =
      new InMemoryUserProfessionalPreferenceRepository();

    const useCase =
      new GetUserProfessionalPreferences(
        userProfileRepository,
        professionalPreferenceRepository,
      );

    return {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    };
  }

  // ==========================================================
  // CREAR PERFIL DE PRUEBA
  // ==========================================================

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
  // TEST 1 — USUARIO SIN PERFIL
  // ==========================================================

  it("devuelve null si el usuario no tiene perfil", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: "usuario-inexistente",
    });

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 2 — PREFERENCIAS SIN CONFIGURAR
  // ==========================================================

  it("devuelve null si no tiene preferencias profesionales", async () => {
    const {
      userProfileRepository,
      useCase,
    } = setup();

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
  // TEST 3 — CONFIGURACIÓN VACÍA
  // ==========================================================

  it("distingue una configuración vacía de una inexistente", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const saved =
      await professionalPreferenceRepository.save(
        UserProfessionalPreference.create(
          profile.id!,
          {
            selectionProcessType: null,
            subjectAreaIds: [],
            qualificationGroups: [],
          },
        ),
      );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual({
      id: saved.id,
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: [],
    });
  });

  // ==========================================================
  // TEST 4 — SOLO PLAZAS
  // ==========================================================

  it("recupera una preferencia de solo plazas", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await professionalPreferenceRepository.save(
      UserProfessionalPreference.create(
        profile.id!,
        {
          selectionProcessType: "POSITIONS",
          subjectAreaIds: [],
          qualificationGroups: [],
        },
      ),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(result?.subjectAreaIds).toEqual([]);
    expect(result?.qualificationGroups).toEqual([]);
  });

  // ==========================================================
  // TEST 5 — PREFERENCIAS COMBINADAS
  // ==========================================================

  it("recupera materias y grupos de titulación", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await professionalPreferenceRepository.save(
      UserProfessionalPreference.create(
        profile.id!,
        {
          selectionProcessType: "BOTH",
          subjectAreaIds: [10, 20, 30],
          qualificationGroups: [
            "A1",
            "A2",
            "C1",
          ],
        },
      ),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.selectionProcessType).toBe(
      "BOTH",
    );

    expect(result?.subjectAreaIds).toEqual([
      10,
      20,
      30,
    ]);

    expect(result?.qualificationGroups).toEqual([
      "A1",
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 6 — INDEPENDENCIA ENTRE OPOSITORES
  // ==========================================================

  it("no devuelve las preferencias de otro opositor", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
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

    await professionalPreferenceRepository.save(
      UserProfessionalPreference.create(
        profileA.id!,
        {
          selectionProcessType: "POSITIONS",
          subjectAreaIds: [10],
          qualificationGroups: ["A1"],
        },
      ),
    );

    await professionalPreferenceRepository.save(
      UserProfessionalPreference.create(
        profileB.id!,
        {
          selectionProcessType: "JOB_POOLS",
          subjectAreaIds: [30],
          qualificationGroups: ["C2"],
        },
      ),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(result?.subjectAreaIds).toEqual([10]);

    expect(result?.qualificationGroups).toEqual([
      "A1",
    ]);

    expect(result?.subjectAreaIds).not.toContain(30);
  });

  // ==========================================================
  // TEST 7 — CONSULTAR DESPUÉS DE MODIFICAR
  // ==========================================================

  it("recupera las preferencias actualizadas", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const saved =
      await professionalPreferenceRepository.save(
        UserProfessionalPreference.create(
          profile.id!,
          {
            selectionProcessType: "POSITIONS",
            subjectAreaIds: [10],
            qualificationGroups: ["A1"],
          },
        ),
      );

    saved.changePreferences({
      selectionProcessType: "JOB_POOLS",
      subjectAreaIds: [20, 30],
      qualificationGroups: ["C1", "C2"],
    });

    await professionalPreferenceRepository.save(saved);

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result?.id).toBe(saved.id);

    expect(result?.selectionProcessType).toBe(
      "JOB_POOLS",
    );

    expect(result?.subjectAreaIds).toEqual([
      20,
      30,
    ]);

    expect(result?.qualificationGroups).toEqual([
      "C1",
      "C2",
    ]);
  });
});
