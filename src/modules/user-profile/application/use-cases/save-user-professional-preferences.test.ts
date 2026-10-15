
import {
  describe,
  expect,
  it,
} from "vitest";

import { UserProfile } from "../../domain/user-profile";

import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { InMemoryUserProfessionalPreferenceRepository } from "../../adapters/repositories/in-memory-user-professional-preference.repository";

import type { ProfessionalPreferenceCatalogQueryRepository } from "../repositories/professional-preference-catalog-query.repository";

import { SaveUserProfessionalPreferences } from "./save-user-professional-preferences";

// ============================================================
// CATÁLOGO FICTICIO PARA LOS TESTS
// ============================================================

class InMemoryProfessionalPreferenceCatalog
  implements ProfessionalPreferenceCatalogQueryRepository
{
  private readonly subjectAreas =
    new Set([10, 20, 30]);

  private readonly qualificationGroups =
    new Set(["A1", "A2", "C1", "C2"]);

  async allSubjectAreasExist(
    ids: number[],
  ): Promise<boolean> {
    return ids.every((id) =>
      this.subjectAreas.has(id),
    );
  }

  async allQualificationGroupsExist(
    groups: string[],
  ): Promise<boolean> {
    return groups.every((group) =>
      this.qualificationGroups.has(group),
    );
  }
}

// ============================================================
// TESTS DEL CASO DE USO
// ============================================================

describe("SaveUserProfessionalPreferences", () => {
  function setup() {
    const userProfileRepository =
      new InMemoryUserProfileRepository();

    const professionalPreferenceRepository =
      new InMemoryUserProfessionalPreferenceRepository();

    const catalogRepository =
      new InMemoryProfessionalPreferenceCatalog();

    const useCase =
      new SaveUserProfessionalPreferences(
        userProfileRepository,
        professionalPreferenceRepository,
        catalogRepository,
      );

    return {
      userProfileRepository,
      professionalPreferenceRepository,
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
  // TEST 1 — USUARIO SIN PERFIL
  // ==========================================================

  it("rechaza guardar si el usuario no tiene perfil", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: "usuario-inexistente",
        selectionProcessType: "BOTH",
        subjectAreaIds: [],
        qualificationGroups: [],
      }),
    ).rejects.toThrow(
      "No se ha encontrado el perfil del opositor",
    );
  });

  // ==========================================================
  // TEST 2 — GUARDAR CONFIGURACIÓN VACÍA
  // ==========================================================

  it("permite guardar todos los criterios vacíos", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const saved = await useCase.execute({
      userId: "user-1",
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    expect(saved.id).toBeDefined();
    expect(saved.selectionProcessType).toBeNull();
    expect(saved.subjectAreaIds).toEqual([]);
    expect(saved.qualificationGroups).toEqual([]);

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored).not.toBeNull();
  });

  // ==========================================================
  // TEST 3 — GUARDAR CONFIGURACIÓN COMPLETA
  // ==========================================================

  it("guarda plazas, bolsas, materias y grupos", async () => {
    const {
      userProfileRepository,
      useCase,
    } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const saved = await useCase.execute({
      userId: "user-1",
      selectionProcessType: "BOTH",
      subjectAreaIds: [10, 20],
      qualificationGroups: ["A1", "A2", "C1"],
    });

    expect(saved.selectionProcessType).toBe("BOTH");
    expect(saved.subjectAreaIds).toEqual([10, 20]);

    expect(saved.qualificationGroups).toEqual([
      "A1",
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 4 — CRITERIOS PARCIALES
  // ==========================================================

  it("permite guardar solo grupos de titulación", async () => {
    const {
      userProfileRepository,
      useCase,
    } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const saved = await useCase.execute({
      userId: "user-1",
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: ["A2", "C1"],
    });

    expect(saved.selectionProcessType).toBeNull();
    expect(saved.subjectAreaIds).toEqual([]);

    expect(saved.qualificationGroups).toEqual([
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 5 — NORMALIZAR DUPLICADOS
  // ==========================================================

  it("elimina duplicados y espacios sobrantes", async () => {
    const {
      userProfileRepository,
      useCase,
    } = setup();

    await createProfile(
      userProfileRepository,
      "user-1",
    );

    const saved = await useCase.execute({
      userId: "user-1",
      selectionProcessType: "POSITIONS",
      subjectAreaIds: [10, 10, 20],
      qualificationGroups: [
        "A1",
        " A1 ",
        "C1",
        "C1",
      ],
    });

    expect(saved.subjectAreaIds).toEqual([10, 20]);

    expect(saved.qualificationGroups).toEqual([
      "A1",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 6 — ACTUALIZAR PREFERENCIAS
  // ==========================================================

  it("actualiza las preferencias manteniendo el ID", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const first = await useCase.execute({
      userId: "user-1",
      selectionProcessType: "POSITIONS",
      subjectAreaIds: [10],
      qualificationGroups: ["A1"],
    });

    const updated = await useCase.execute({
      userId: "user-1",
      selectionProcessType: "JOB_POOLS",
      subjectAreaIds: [20, 30],
      qualificationGroups: ["C1", "C2"],
    });

    expect(updated.id).toBe(first.id);
    expect(updated.selectionProcessType).toBe(
      "JOB_POOLS",
    );
    expect(updated.subjectAreaIds).toEqual([20, 30]);
    expect(updated.qualificationGroups).toEqual([
      "C1",
      "C2",
    ]);

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored?.id).toBe(first.id);
  });

  // ==========================================================
  // TEST 7 — RECHAZAR MATERIA INEXISTENTE
  // ==========================================================

  it("rechaza una materia que no existe en el catálogo", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        selectionProcessType: "BOTH",
        subjectAreaIds: [10, 999],
        qualificationGroups: ["A1"],
      }),
    ).rejects.toThrow(
      "Alguna de las materias seleccionadas no está disponible en CIDO",
    );

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored).toBeNull();
  });

  // ==========================================================
  // TEST 8 — RECHAZAR GRUPO INEXISTENTE
  // ==========================================================

  it("rechaza un grupo que no existe en el catálogo", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        selectionProcessType: "BOTH",
        subjectAreaIds: [10],
        qualificationGroups: ["A1", "INVALIDO"],
      }),
    ).rejects.toThrow(
      "Alguno de los grupos de titulación seleccionados no está disponible en CIDO",
    );

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored).toBeNull();
  });

  // ==========================================================
  // TEST 9 — CONSERVAR PREFERENCIAS ANTERIORES
  // ==========================================================

  it("conserva las preferencias anteriores si la actualización es inválida", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const original = await useCase.execute({
      userId: "user-1",
      selectionProcessType: "POSITIONS",
      subjectAreaIds: [10],
      qualificationGroups: ["A1"],
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [20],
        qualificationGroups: ["INVALIDO"],
      }),
    ).rejects.toThrow();

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored?.id).toBe(original.id);
    expect(stored?.selectionProcessType).toBe(
      "POSITIONS",
    );
    expect(stored?.subjectAreaIds).toEqual([10]);
    expect(stored?.qualificationGroups).toEqual([
      "A1",
    ]);
  });

  // ==========================================================
  // TEST 10 — INDEPENDENCIA ENTRE OPOSITORES
  // ==========================================================

  it("no modifica las preferencias de otro opositor", async () => {
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

    await useCase.execute({
      userId: "user-a",
      selectionProcessType: "POSITIONS",
      subjectAreaIds: [10],
      qualificationGroups: ["A1"],
    });

    await useCase.execute({
      userId: "user-b",
      selectionProcessType: "JOB_POOLS",
      subjectAreaIds: [30],
      qualificationGroups: ["C2"],
    });

    // Modificamos exclusivamente al usuario A.
    await useCase.execute({
      userId: "user-a",
      selectionProcessType: "BOTH",
      subjectAreaIds: [20],
      qualificationGroups: ["A2"],
    });

    const first =
      await professionalPreferenceRepository
        .findByUserProfileId(profileA.id!);

    const second =
      await professionalPreferenceRepository
        .findByUserProfileId(profileB.id!);

    expect(first?.selectionProcessType).toBe("BOTH");
    expect(first?.subjectAreaIds).toEqual([20]);

    expect(second?.selectionProcessType).toBe(
      "JOB_POOLS",
    );
    expect(second?.subjectAreaIds).toEqual([30]);
    expect(second?.qualificationGroups).toEqual([
      "C2",
    ]);
  });

  // ==========================================================
  // TEST 11 — VACIAR CRITERIOS SIN ELIMINAR
  // ==========================================================

  it("permite vaciar los criterios conservando la configuración", async () => {
    const {
      userProfileRepository,
      professionalPreferenceRepository,
      useCase,
    } = setup();

    const profile = await createProfile(
      userProfileRepository,
      "user-1",
    );

    const first = await useCase.execute({
      userId: "user-1",
      selectionProcessType: "BOTH",
      subjectAreaIds: [10],
      qualificationGroups: ["A1"],
    });

    const updated = await useCase.execute({
      userId: "user-1",
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    expect(updated.id).toBe(first.id);
    expect(updated.selectionProcessType).toBeNull();
    expect(updated.subjectAreaIds).toEqual([]);
    expect(updated.qualificationGroups).toEqual([]);

    const stored =
      await professionalPreferenceRepository
        .findByUserProfileId(profile.id!);

    expect(stored).not.toBeNull();
  });

  // ==========================================================
  // TEST 12 — IDENTIFICADOR DE USUARIO INVÁLIDO
  // ==========================================================

  it("rechaza un identificador de usuario vacío", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        userId: "  ",
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: [],
      }),
    ).rejects.toThrow(
      "El identificador del usuario no es válido",
    );
  });
});
