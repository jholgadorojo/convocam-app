
import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { UserProfessionalPreference } from "../../domain/user-professional-preference";

import { InMemoryUserProfessionalPreferenceRepository } from "./in-memory-user-professional-preference.repository";

describe("InMemoryUserProfessionalPreferenceRepository", () => {
  let repository: InMemoryUserProfessionalPreferenceRepository;

  beforeEach(() => {
    repository =
      new InMemoryUserProfessionalPreferenceRepository();
  });

  // ==========================================================
  // FUNCIÓN AUXILIAR
  // ==========================================================

  function createPreference(
    userProfileId: number,
  ): UserProfessionalPreference {
    return UserProfessionalPreference.create(
      userProfileId,
      {
        selectionProcessType: "POSITIONS",
        subjectAreaIds: [10, 20],
        qualificationGroups: ["A2", "C1"],
      },
    );
  }

  // ==========================================================
  // TEST 1 — SIN CONFIGURAR
  // ==========================================================

  it("devuelve null si no existen preferencias", async () => {
    const result =
      await repository.findByUserProfileId(1);

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 2 — CONFIGURACIÓN SIN CRITERIOS
  // ==========================================================

  it("guarda una configuración con criterios opcionales vacíos", async () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: [],
      });

    const saved = await repository.save(preference);

    expect(saved.id).toBe(1);
    expect(saved.userProfileId).toBe(1);
    expect(saved.selectionProcessType).toBeNull();
    expect(saved.subjectAreaIds).toEqual([]);
    expect(saved.qualificationGroups).toEqual([]);

    const result =
      await repository.findByUserProfileId(1);

    expect(result).not.toBeNull();
  });

  // ==========================================================
  // TEST 3 — BOLSAS DE TRABAJO
  // ==========================================================

  it("guarda una preferencia de solo bolsas de trabajo", async () => {
    const saved = await repository.save(
      UserProfessionalPreference.create(1, {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [],
        qualificationGroups: [],
      }),
    );

    expect(saved.selectionProcessType).toBe(
      "JOB_POOLS",
    );
  });

  // ==========================================================
  // TEST 4 — MATERIAS Y GRUPOS
  // ==========================================================

  it("guarda materias y grupos de titulación combinados", async () => {
    await repository.save(
      UserProfessionalPreference.create(1, {
        selectionProcessType: "BOTH",
        subjectAreaIds: [10, 20, 30],
        qualificationGroups: ["A1", "A2", "C1"],
      }),
    );

    const result =
      await repository.findByUserProfileId(1);

    expect(result?.selectionProcessType).toBe("BOTH");

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
  // TEST 5 — ACTUALIZAR CONFIGURACIÓN
  // ==========================================================

  it("actualiza preferencias conservando el identificador", async () => {
    const first = await repository.save(
      createPreference(1),
    );

    const updated = await repository.save(
      UserProfessionalPreference.create(1, {
        selectionProcessType: "BOTH",
        subjectAreaIds: [30],
        qualificationGroups: ["C2"],
      }),
    );

    expect(updated.id).toBe(first.id);
    expect(updated.selectionProcessType).toBe("BOTH");
    expect(updated.subjectAreaIds).toEqual([30]);
    expect(updated.qualificationGroups).toEqual(["C2"]);
  });

  // ==========================================================
  // TEST 6 — LIMPIAR CRITERIOS
  // ==========================================================

  it("permite dejar todos los criterios vacíos", async () => {
    const saved = await repository.save(
      createPreference(1),
    );

    saved.changePreferences({
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    await repository.save(saved);

    const result =
      await repository.findByUserProfileId(1);

    expect(result).not.toBeNull();
    expect(result?.selectionProcessType).toBeNull();
    expect(result?.subjectAreaIds).toEqual([]);
    expect(result?.qualificationGroups).toEqual([]);
  });

  // ==========================================================
  // TEST 7 — MODIFICAR SIN GUARDAR
  // ==========================================================

  it("no modifica los datos almacenados sin ejecutar save", async () => {
    await repository.save(
      createPreference(1),
    );

    const preference =
      await repository.findByUserProfileId(1);

    preference!.changePreferences({
      selectionProcessType: "JOB_POOLS",
      subjectAreaIds: [30],
      qualificationGroups: ["C2"],
    });

    const stored =
      await repository.findByUserProfileId(1);

    expect(stored?.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(stored?.subjectAreaIds).toEqual([10, 20]);

    expect(stored?.qualificationGroups).toEqual([
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 8 — GUARDAR UNA ENTIDAD RECUPERADA
  // ==========================================================

  it("guarda las modificaciones de una entidad recuperada", async () => {
    const first = await repository.save(
      createPreference(1),
    );

    const preference =
      await repository.findByUserProfileId(1);

    preference!.changePreferences({
      selectionProcessType: "JOB_POOLS",
      subjectAreaIds: [30],
      qualificationGroups: ["C2"],
    });

    const updated =
      await repository.save(preference!);

    expect(updated.id).toBe(first.id);

    const stored =
      await repository.findByUserProfileId(1);

    expect(stored?.selectionProcessType).toBe(
      "JOB_POOLS",
    );
    expect(stored?.subjectAreaIds).toEqual([30]);
    expect(stored?.qualificationGroups).toEqual(["C2"]);
  });

  // ==========================================================
  // TEST 9 — PROTEGER LOS DATOS ALMACENADOS
  // ==========================================================

  it("no permite alterar datos almacenados modificando la entidad original", async () => {
    const original = createPreference(1);

    await repository.save(original);

    original.changePreferences({
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    const stored =
      await repository.findByUserProfileId(1);

    expect(stored?.selectionProcessType).toBe(
      "POSITIONS",
    );
    expect(stored?.subjectAreaIds).toEqual([10, 20]);
    expect(stored?.qualificationGroups).toEqual([
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 10 — INDEPENDENCIA ENTRE PERFILES
  // ==========================================================

  it("mantiene independientes las preferencias de dos perfiles", async () => {
    await repository.save(
      createPreference(1),
    );

    await repository.save(
      UserProfessionalPreference.create(2, {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [30],
        qualificationGroups: ["C2"],
      }),
    );

    const first =
      await repository.findByUserProfileId(1);

    const second =
      await repository.findByUserProfileId(2);

    expect(first?.id).not.toBe(second?.id);

    expect(first?.selectionProcessType).toBe(
      "POSITIONS",
    );
    expect(second?.selectionProcessType).toBe(
      "JOB_POOLS",
    );

    expect(first?.subjectAreaIds).toEqual([10, 20]);
    expect(second?.subjectAreaIds).toEqual([30]);
  });

  // ==========================================================
  // TEST 11 — IDENTIFICADOR INEXISTENTE
  // ==========================================================

  it("rechaza guardar una configuración con ID inexistente", async () => {
    const invalid = UserProfessionalPreference.restore({
      id: 999,
      userProfileId: 1,
      selectionProcessType: "BOTH",
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    await expect(
      repository.save(invalid),
    ).rejects.toThrow(
      "Las preferencias profesionales no existen",
    );
  });

  // ==========================================================
  // TEST 12 — IDENTIFICADOR INCORRECTO
  // ==========================================================

  it("rechaza cambiar el identificador de una configuración existente", async () => {
    const first = await repository.save(
      createPreference(1),
    );

    const invalid = UserProfessionalPreference.restore({
      id: 999,
      userProfileId: 1,
      selectionProcessType: "BOTH",
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    await expect(
      repository.save(invalid),
    ).rejects.toThrow(
      "Las preferencias no pertenecen al perfil indicado",
    );

    const stored =
      await repository.findByUserProfileId(1);

    expect(stored?.id).toBe(first.id);
    expect(stored?.selectionProcessType).toBe(
      "POSITIONS",
    );
  });

  // ==========================================================
  // TEST 13 — ELIMINAR PREFERENCIAS
  // ==========================================================

  it("elimina las preferencias de un perfil", async () => {
    await repository.save(
      createPreference(1),
    );

    const deleted =
      await repository.deleteByUserProfileId(1);

    expect(deleted).toBe(true);

    const result =
      await repository.findByUserProfileId(1);

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 14 — ELIMINAR CONFIGURACIÓN INEXISTENTE
  // ==========================================================

  it("devuelve false si las preferencias no existen", async () => {
    const deleted =
      await repository.deleteByUserProfileId(999);

    expect(deleted).toBe(false);
  });

  // ==========================================================
  // TEST 15 — NO AFECTAR A OTROS PERFILES
  // ==========================================================

  it("no elimina las preferencias de otro perfil", async () => {
    await repository.save(
      createPreference(1),
    );

    await repository.save(
      UserProfessionalPreference.create(2, {
        selectionProcessType: "BOTH",
        subjectAreaIds: [30],
        qualificationGroups: ["C2"],
      }),
    );

    await repository.deleteByUserProfileId(1);

    const first =
      await repository.findByUserProfileId(1);

    const second =
      await repository.findByUserProfileId(2);

    expect(first).toBeNull();

    expect(second?.selectionProcessType).toBe("BOTH");
    expect(second?.subjectAreaIds).toEqual([30]);
    expect(second?.qualificationGroups).toEqual(["C2"]);
  });

  // ==========================================================
  // TEST 16 — VOLVER A CONFIGURAR
  // ==========================================================

  it("permite configurar de nuevo después de eliminar", async () => {
    const first = await repository.save(
      createPreference(1),
    );

    await repository.deleteByUserProfileId(1);

    const second = await repository.save(
      UserProfessionalPreference.create(1, {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [],
        qualificationGroups: ["A1"],
      }),
    );

    expect(second.id).not.toBe(first.id);
    expect(second.selectionProcessType).toBe(
      "JOB_POOLS",
    );
    expect(second.qualificationGroups).toEqual(["A1"]);
  });
});
