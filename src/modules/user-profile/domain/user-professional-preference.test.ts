
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  UserProfessionalPreference,
  type ProfessionalPreferenceSelection,
} from "./user-professional-preference";

describe("UserProfessionalPreference", () => {
  // ==========================================================
  // TEST 1 — CREAR SIN CRITERIOS
  // ==========================================================

  it("crea preferencias con todos los criterios opcionales vacíos", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: [],
      });

    expect(preference.id).toBeUndefined();
    expect(preference.userProfileId).toBe(1);
    expect(preference.selectionProcessType).toBeNull();
    expect(preference.subjectAreaIds).toEqual([]);
    expect(preference.qualificationGroups).toEqual([]);
  });

  // ==========================================================
  // TEST 2 — SOLO PLAZAS
  // ==========================================================

  it("permite seleccionar solo plazas", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "POSITIONS",
        subjectAreaIds: [],
        qualificationGroups: [],
      });

    expect(preference.selectionProcessType).toBe(
      "POSITIONS",
    );
  });

  // ==========================================================
  // TEST 3 — SOLO BOLSAS
  // ==========================================================

  it("permite seleccionar solo bolsas de trabajo", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [],
        qualificationGroups: [],
      });

    expect(preference.selectionProcessType).toBe(
      "JOB_POOLS",
    );
  });

  // ==========================================================
  // TEST 4 — PLAZAS Y BOLSAS
  // ==========================================================

  it("permite seleccionar plazas y bolsas", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "BOTH",
        subjectAreaIds: [],
        qualificationGroups: [],
      });

    expect(preference.selectionProcessType).toBe(
      "BOTH",
    );
  });

  // ==========================================================
  // TEST 5 — MATERIAS Y GRUPOS COMBINADOS
  // ==========================================================

  it("permite combinar materias y grupos de titulación", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "BOTH",
        subjectAreaIds: [10, 20, 30],
        qualificationGroups: ["A1", "A2", "C1"],
      });

    expect(preference.subjectAreaIds).toEqual([
      10,
      20,
      30,
    ]);

    expect(preference.qualificationGroups).toEqual([
      "A1",
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 6 — SOLO MATERIAS
  // ==========================================================

  it("permite seleccionar materias sin otros criterios", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: null,
        subjectAreaIds: [10, 20],
        qualificationGroups: [],
      });

    expect(preference.selectionProcessType).toBeNull();
    expect(preference.subjectAreaIds).toEqual([10, 20]);
  });

  // ==========================================================
  // TEST 7 — SOLO GRUPOS
  // ==========================================================

  it("permite seleccionar grupos sin otros criterios", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: ["A2", "C1"],
      });

    expect(preference.qualificationGroups).toEqual([
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 8 — DUPLICADOS
  // ==========================================================

  it("elimina materias y grupos duplicados", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "BOTH",
        subjectAreaIds: [10, 10, 20],
        qualificationGroups: [
          "A1",
          " A1 ",
          "C1",
          "C1",
        ],
      });

    expect(preference.subjectAreaIds).toEqual([
      10,
      20,
    ]);

    expect(preference.qualificationGroups).toEqual([
      "A1",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 9 — PERFIL INVÁLIDO
  // ==========================================================

  it("rechaza un identificador de perfil inválido", () => {
    expect(() =>
      UserProfessionalPreference.create(0, {
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: [],
      }),
    ).toThrow(
      "El identificador del perfil no es válido",
    );
  });

  // ==========================================================
  // TEST 10 — MATERIA INVÁLIDA
  // ==========================================================

  it("rechaza identificadores de materias inválidos", () => {
    expect(() =>
      UserProfessionalPreference.create(1, {
        selectionProcessType: null,
        subjectAreaIds: [0],
        qualificationGroups: [],
      }),
    ).toThrow(
      "El identificador de la materia no es válido",
    );
  });

  // ==========================================================
  // TEST 11 — GRUPO VACÍO
  // ==========================================================

  it("rechaza grupos de titulación vacíos", () => {
    expect(() =>
      UserProfessionalPreference.create(1, {
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: ["A1", "   "],
      }),
    ).toThrow(
      "El grupo de titulación no puede estar vacío",
    );
  });

  // ==========================================================
  // TEST 12 — TIPO INVÁLIDO
  // ==========================================================

  it("rechaza un tipo de convocatoria incorrecto", () => {
    const selection = {
      selectionProcessType: "INVALID",
      subjectAreaIds: [],
      qualificationGroups: [],
    } as unknown as ProfessionalPreferenceSelection;

    expect(() =>
      UserProfessionalPreference.create(
        1,
        selection,
      ),
    ).toThrow(
      "El tipo de convocatoria no es válido",
    );
  });

  // ==========================================================
  // TEST 13 — RESTAURAR
  // ==========================================================

  it("restaura unas preferencias existentes", () => {
    const preference =
      UserProfessionalPreference.restore({
        id: 15,
        userProfileId: 1,
        selectionProcessType: "POSITIONS",
        subjectAreaIds: [10],
        qualificationGroups: ["A2"],
      });

    expect(preference.id).toBe(15);
    expect(preference.userProfileId).toBe(1);
    expect(preference.selectionProcessType).toBe(
      "POSITIONS",
    );
    expect(preference.subjectAreaIds).toEqual([10]);
    expect(preference.qualificationGroups).toEqual([
      "A2",
    ]);
  });

  // ==========================================================
  // TEST 14 — RESTAURAR ID INVÁLIDO
  // ==========================================================

  it("rechaza restaurar preferencias sin ID válido", () => {
    expect(() =>
      UserProfessionalPreference.restore({
        id: 0,
        userProfileId: 1,
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: [],
      }),
    ).toThrow(
      "El identificador de las preferencias profesionales no es válido",
    );
  });

  // ==========================================================
  // TEST 15 — MODIFICAR PREFERENCIAS
  // ==========================================================

  it("permite modificar las preferencias", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "POSITIONS",
        subjectAreaIds: [10],
        qualificationGroups: ["A1"],
      });

    preference.changePreferences({
      selectionProcessType: "JOB_POOLS",
      subjectAreaIds: [20, 30],
      qualificationGroups: ["C1", "C2"],
    });

    expect(preference.selectionProcessType).toBe(
      "JOB_POOLS",
    );

    expect(preference.subjectAreaIds).toEqual([
      20,
      30,
    ]);

    expect(preference.qualificationGroups).toEqual([
      "C1",
      "C2",
    ]);
  });

  // ==========================================================
  // TEST 16 — NO MODIFICAR SI HAY ERROR
  // ==========================================================

  it("conserva los valores anteriores si la modificación es inválida", () => {
    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "POSITIONS",
        subjectAreaIds: [10],
        qualificationGroups: ["A1"],
      });

    expect(() =>
      preference.changePreferences({
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [20],
        qualificationGroups: [""],
      }),
    ).toThrow();

    expect(preference.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(preference.subjectAreaIds).toEqual([10]);
    expect(preference.qualificationGroups).toEqual([
      "A1",
    ]);
  });

  // ==========================================================
  // TEST 17 — PROTEGER ARRAYS
  // ==========================================================

  it("no permite modificar sus arrays desde fuera", () => {
    const subjectAreaIds = [10];

    const qualificationGroups = ["A1"];

    const preference =
      UserProfessionalPreference.create(1, {
        selectionProcessType: "BOTH",
        subjectAreaIds,
        qualificationGroups,
      });

    // Modificar los datos originales.
    subjectAreaIds.push(20);
    qualificationGroups.push("C1");

    // Modificar los valores devueltos por getters.
    preference.subjectAreaIds.push(30);
    preference.qualificationGroups.push("C2");

    expect(preference.subjectAreaIds).toEqual([10]);
    expect(preference.qualificationGroups).toEqual([
      "A1",
    ]);
  });
});
