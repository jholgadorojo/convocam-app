
import {
  describe,
  expect,
  it,
} from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { UserProfessionalPreference } from "../../domain/user-professional-preference";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserProfessionalPreferenceRepository } from "../../adapters/repositories/in-memory-user-professional-preference.repository";

import { DeleteUserProfessionalPreferences } from "./delete-user-professional-preferences";

// ============================================================
// TESTS: ELIMINAR PREFERENCIAS PROFESIONALES
// ============================================================

describe("DeleteUserProfessionalPreferences", () => {
  // ==========================================================
  // PREPARAR LOS REPOSITORIOS
  // ==========================================================

  function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const professionalPreferenceRepository =
      new InMemoryUserProfessionalPreferenceRepository();

    const useCase =
      new DeleteUserProfessionalPreferences(
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
  // CREAR PREFERENCIAS DE PRUEBA
  // ==========================================================

  function createPreference(
    userProfileId: number,
  ) {
    return UserProfessionalPreference.create(
      userProfileId,
      {
        selectionProcessType: "BOTH",
        subjectAreaIds: [10, 20],
        qualificationGroups: ["A2", "C1"],
      },
    );
  }

  // ==========================================================
  // TEST 1 — USUARIO SIN PERFIL
  // ==========================================================

  it("rechaza eliminar si el usuario no tiene perfil", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
      }),
    ).rejects.toThrow(
      "No se ha encontrado el perfil del opositor",
    );
  });

  // ==========================================================
  // TEST 2 — PREFERENCIAS SIN CONFIGURAR
  // ==========================================================

  it("devuelve false si no existen preferencias", async () => {
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

    expect(result).toBe(false);
  });

  // ==========================================================
  // TEST 3 — ELIMINAR PREFERENCIAS
  // ==========================================================

  it("elimina las preferencias profesionales guardadas", async () => {
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
      createPreference(profile.id!),
    );

    const result = await useCase.execute({
      userId: "user-1",
    });

    expect(result).toBe(true);

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored).toBeNull();
  });

  // ==========================================================
  // TEST 4 — ELIMINACIÓN REPETIDA
  // ==========================================================

  it("devuelve false cuando se intenta eliminar de nuevo", async () => {
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
      createPreference(profile.id!),
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
  // TEST 5 — INDEPENDENCIA ENTRE OPOSITORES
  // ==========================================================

  it("no elimina las preferencias de otro opositor", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profileA = await createProfile(
      userProfileRepository,
      "user-a",
    );

    const profileB = await createProfile(
      userProfileRepository,
      "user-b",
    );

    await professionalPreferenceRepository.save(
      createPreference(profileA.id!),
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

    // Eliminar únicamente las preferencias del usuario A.
    await useCase.execute({
      userId: "user-a",
    });

    const first =
      await professionalPreferenceRepository
        .findByUserProfileId(profileA.id!);

    const second =
      await professionalPreferenceRepository
        .findByUserProfileId(profileB.id!);

    expect(first).toBeNull();

    expect(second).not.toBeNull();

    expect(second?.selectionProcessType).toBe(
      "JOB_POOLS",
    );

    expect(second?.subjectAreaIds).toEqual([30]);

    expect(second?.qualificationGroups).toEqual([
      "C2",
    ]);
  });

  // ==========================================================
  // TEST 6 — VOLVER A CONFIGURAR
  // ==========================================================

  it("permite guardar nuevas preferencias después de eliminar", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const first =
      await professionalPreferenceRepository.save(
        createPreference(profile.id!),
      );

    await useCase.execute({
      userId: "user-1",
    });

    const second =
      await professionalPreferenceRepository.save(
        UserProfessionalPreference.create(
          profile.id!,
          {
            selectionProcessType: "POSITIONS",
            subjectAreaIds: [30],
            qualificationGroups: ["A1"],
          },
        ),
      );

    expect(second.id).toBeDefined();

    expect(second.id).not.toBe(first.id);

    expect(second.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(second.subjectAreaIds).toEqual([30]);

    expect(second.qualificationGroups).toEqual([
      "A1",
    ]);
  });

  // ==========================================================
  // TEST 7 — IDENTIFICADOR VACÍO
  // ==========================================================

  it("rechaza un identificador de usuario vacío", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: "   ",
      }),
    ).rejects.toThrow(
      "El identificador del usuario no es válido",
    );
  });

  // ==========================================================
  // TEST 8 — CONFIGURACIÓN VACÍA EXISTENTE
  // ==========================================================

  it("elimina también una configuración sin criterios", async () => {
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
          selectionProcessType: null,
          subjectAreaIds: [],
          qualificationGroups: [],
        },
      ),
    );

    const deleted = await useCase.execute({
      userId: "user-1",
    });

    expect(deleted).toBe(true);

    const result =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(result).toBeNull();
  });
});
