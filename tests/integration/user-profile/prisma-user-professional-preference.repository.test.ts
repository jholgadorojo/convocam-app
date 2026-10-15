
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

import { UserProfessionalPreference } from "@/modules/user-profile/domain/user-professional-preference";

import { PrismaUserProfessionalPreferenceRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-professional-preference.repository";

// ============================================================
// TESTS DE INTEGRACIÓN
// ============================================================

describe("PrismaUserProfessionalPreferenceRepository", () => {
  let prisma: PrismaClient;
  let repository: PrismaUserProfessionalPreferenceRepository;

  let profileAId: number;
  let profileBId: number;

  let subjectAreaAId: number;
  let subjectAreaBId: number;

  let testUserIds: string[] = [];
  let testSubjectAreaCodes: string[] = [];

  // ==========================================================
  // CONECTAR EXCLUSIVAMENTE A LA BASE DE PRUEBAS
  // ==========================================================

  beforeAll(async () => {
    config({
      path: ".env.test",
      override: true,
    });

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL no está configurada",
      );
    }

    const databaseName = decodeURIComponent(
      new URL(connectionString).pathname.replace(/^\/+/, ""),
    );

    if (databaseName !== "convocam_test") {
      throw new Error(
        "Estas pruebas deben utilizar convocam_test",
      );
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    prisma = new PrismaClient({ adapter });

    repository =
      new PrismaUserProfessionalPreferenceRepository(
        prisma,
      );
  });

  // ==========================================================
  // CREAR DATOS FICTICIOS PARA CADA TEST
  // ==========================================================

  beforeEach(async () => {
    const suffix = randomUUID();

    const userAId = `prof-test-a-${suffix}`;
    const userBId = `prof-test-b-${suffix}`;

    testUserIds = [userAId, userBId];

    const subjectCodeA = `prof-subject-a-${suffix}`;
    const subjectCodeB = `prof-subject-b-${suffix}`;

    testSubjectAreaCodes = [
      subjectCodeA,
      subjectCodeB,
    ];

    // --------------------------------------------------------
    // USUARIO A
    // --------------------------------------------------------

    await prisma.user.create({
      data: {
        id: userAId,
        name: "Usuario A",
        email: `prof-a-${suffix}@example.test`,
      },
    });

    const profileA = await prisma.userProfile.create({
      data: {
        userId: userAId,
        firstName: "Usuario",
        lastName: "A",
      },
    });

    profileAId = profileA.id;

    // --------------------------------------------------------
    // USUARIO B
    // --------------------------------------------------------

    await prisma.user.create({
      data: {
        id: userBId,
        name: "Usuario B",
        email: `prof-b-${suffix}@example.test`,
      },
    });

    const profileB = await prisma.userProfile.create({
      data: {
        userId: userBId,
        firstName: "Usuario",
        lastName: "B",
      },
    });

    profileBId = profileB.id;

    // --------------------------------------------------------
    // MATERIA PROFESIONAL A
    // --------------------------------------------------------

    const subjectAreaA = await prisma.subjectArea.create({
      data: {
        cidoId: subjectCodeA,
        cidoModuleId: 1,
        name: "Materia de prueba A",
      },
    });

    subjectAreaAId = subjectAreaA.id;

    // --------------------------------------------------------
    // MATERIA PROFESIONAL B
    // --------------------------------------------------------

    const subjectAreaB = await prisma.subjectArea.create({
      data: {
        cidoId: subjectCodeB,
        cidoModuleId: 1,
        name: "Materia de prueba B",
      },
    });

    subjectAreaBId = subjectAreaB.id;
  });

  // ==========================================================
  // ELIMINAR LOS DATOS FICTICIOS
  // ==========================================================

  afterEach(async () => {
    if (!prisma) return;

    // El usuario elimina en cascada su perfil y
    // sus preferencias profesionales asociadas.
    await prisma.user.deleteMany({
      where: {
        id: {
          in: testUserIds,
        },
      },
    });

    // Eliminar únicamente las materias creadas
    // para este test.
    await prisma.subjectArea.deleteMany({
      where: {
        cidoId: {
          in: testSubjectAreaCodes,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  // ==========================================================
  // FUNCIÓN AUXILIAR
  // ==========================================================

  function createPreference(
    userProfileId: number,
    selectionProcessType:
      | "POSITIONS"
      | "JOB_POOLS"
      | "BOTH"
      | null,
    subjectAreaIds: number[],
    qualificationGroups: string[],
  ): UserProfessionalPreference {
    return UserProfessionalPreference.create(
      userProfileId,
      {
        selectionProcessType,
        subjectAreaIds,
        qualificationGroups,
      },
    );
  }

  // ==========================================================
  // TEST 1 — SIN CONFIGURAR
  // ==========================================================

  it("devuelve null si no existen preferencias", async () => {
    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result).toBeNull();
  });

  // ==========================================================
  // TEST 2 — CONFIGURACIÓN SIN CRITERIOS
  // ==========================================================

  it("guarda una configuración con todos los criterios vacíos", async () => {
    const saved = await repository.save(
      createPreference(
        profileAId,
        null,
        [],
        [],
      ),
    );

    expect(saved.id).toBeDefined();
    expect(saved.selectionProcessType).toBeNull();
    expect(saved.subjectAreaIds).toEqual([]);
    expect(saved.qualificationGroups).toEqual([]);

    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(saved.id);
  });

  // ==========================================================
  // TEST 3 — CONFIGURACIÓN COMPLETA
  // ==========================================================

  it("guarda tipo de convocatoria, materias y grupos", async () => {
    const saved = await repository.save(
      createPreference(
        profileAId,
        "BOTH",
        [subjectAreaAId, subjectAreaBId],
        ["A1", "A2", "C1"],
      ),
    );

    expect(saved.id).toBeDefined();

    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result?.selectionProcessType).toBe(
      "BOTH",
    );

    expect(result?.subjectAreaIds).toEqual(
      [subjectAreaAId, subjectAreaBId].sort(
        (a, b) => a - b,
      ),
    );

    expect(result?.qualificationGroups).toEqual([
      "A1",
      "A2",
      "C1",
    ]);
  });

  // ==========================================================
  // TEST 4 — SOLO GRUPOS DE TITULACIÓN
  // ==========================================================

  it("permite guardar grupos sin seleccionar materias ni tipo", async () => {
    await repository.save(
      createPreference(
        profileAId,
        null,
        [],
        ["A2", "C2"],
      ),
    );

    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result?.selectionProcessType).toBeNull();
    expect(result?.subjectAreaIds).toEqual([]);

    expect(result?.qualificationGroups).toEqual([
      "A2",
      "C2",
    ]);
  });

  // ==========================================================
  // TEST 5 — ACTUALIZAR PREFERENCIAS
  // ==========================================================

  it("actualiza preferencias sin crear otra configuración", async () => {
    const first = await repository.save(
      createPreference(
        profileAId,
        "POSITIONS",
        [subjectAreaAId],
        ["A2"],
      ),
    );

    const updated = await repository.save(
      createPreference(
        profileAId,
        "JOB_POOLS",
        [subjectAreaBId],
        ["C1", "C2"],
      ),
    );

    expect(updated.id).toBe(first.id);

    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result?.selectionProcessType).toBe(
      "JOB_POOLS",
    );

    expect(result?.subjectAreaIds).toEqual([
      subjectAreaBId,
    ]);

    expect(result?.qualificationGroups).toEqual([
      "C1",
      "C2",
    ]);

    const count =
      await prisma.userProfessionalPreference.count({
        where: {
          userProfileId: profileAId,
        },
      });

    expect(count).toBe(1);
  });

  // ==========================================================
  // TEST 6 — LIMPIAR CRITERIOS
  // ==========================================================

  it("permite dejar los criterios vacíos sin eliminar el registro", async () => {
    const saved = await repository.save(
      createPreference(
        profileAId,
        "BOTH",
        [subjectAreaAId],
        ["A1"],
      ),
    );

    saved.changePreferences({
      selectionProcessType: null,
      subjectAreaIds: [],
      qualificationGroups: [],
    });

    await repository.save(saved);

    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(saved.id);
    expect(result?.selectionProcessType).toBeNull();
    expect(result?.subjectAreaIds).toEqual([]);
    expect(result?.qualificationGroups).toEqual([]);

    // Comprobar que las relaciones anteriores
    // han sido eliminadas de PostgreSQL.
    const subjectCount =
      await prisma.userPreferredSubjectArea.count({
        where: {
          professionalPreferenceId: saved.id,
        },
      });

    const groupCount =
      await prisma.userPreferredQualificationGroup.count({
        where: {
          professionalPreferenceId: saved.id,
        },
      });

    expect(subjectCount).toBe(0);
    expect(groupCount).toBe(0);
  });

  // ==========================================================
  // TEST 7 — INDEPENDENCIA ENTRE OPOSITORES
  // ==========================================================

  it("mantiene independientes las preferencias de dos perfiles", async () => {
    await repository.save(
      createPreference(
        profileAId,
        "POSITIONS",
        [subjectAreaAId],
        ["A1"],
      ),
    );

    await repository.save(
      createPreference(
        profileBId,
        "JOB_POOLS",
        [subjectAreaBId],
        ["C2"],
      ),
    );

    const first =
      await repository.findByUserProfileId(profileAId);

    const second =
      await repository.findByUserProfileId(profileBId);

    expect(first?.id).not.toBe(second?.id);

    expect(first?.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(second?.selectionProcessType).toBe(
      "JOB_POOLS",
    );

    expect(first?.subjectAreaIds).toEqual([
      subjectAreaAId,
    ]);

    expect(second?.subjectAreaIds).toEqual([
      subjectAreaBId,
    ]);
  });

  // ==========================================================
  // TEST 8 — NO UTILIZAR EL ID DE OTRO PERFIL
  // ==========================================================

  it("impide utilizar el identificador de otro opositor", async () => {
    const first = await repository.save(
      createPreference(
        profileAId,
        "POSITIONS",
        [subjectAreaAId],
        ["A1"],
      ),
    );

    await repository.save(
      createPreference(
        profileBId,
        "JOB_POOLS",
        [subjectAreaBId],
        ["C2"],
      ),
    );

    const invalid =
      UserProfessionalPreference.restore({
        id: first.id!,
        userProfileId: profileBId,
        selectionProcessType: "BOTH",
        subjectAreaIds: [],
        qualificationGroups: [],
      });

    await expect(
      repository.save(invalid),
    ).rejects.toThrow(
      "Las preferencias no pertenecen al perfil indicado",
    );

    const original =
      await repository.findByUserProfileId(profileAId);

    expect(original?.id).toBe(first.id);

    expect(original?.selectionProcessType).toBe(
      "POSITIONS",
    );
  });

  // ==========================================================
  // TEST 9 — ELIMINAR PREFERENCIAS
  // ==========================================================

  it("elimina preferencias sin afectar a otros usuarios ni al catálogo", async () => {
    await repository.save(
      createPreference(
        profileAId,
        "POSITIONS",
        [subjectAreaAId],
        ["A1"],
      ),
    );

    await repository.save(
      createPreference(
        profileBId,
        "JOB_POOLS",
        [subjectAreaBId],
        ["C2"],
      ),
    );

    const deleted =
      await repository.deleteByUserProfileId(profileAId);

    expect(deleted).toBe(true);

    const first =
      await repository.findByUserProfileId(profileAId);

    const second =
      await repository.findByUserProfileId(profileBId);

    expect(first).toBeNull();
    expect(second).not.toBeNull();

    // Las materias del catálogo deben seguir existiendo.
    const subjects = await prisma.subjectArea.count({
      where: {
        id: {
          in: [subjectAreaAId, subjectAreaBId],
        },
      },
    });

    expect(subjects).toBe(2);
  });

  // ==========================================================
  // TEST 10 — ELIMINACIÓN REPETIDA
  // ==========================================================

  it("devuelve false cuando no existen preferencias", async () => {
    const first =
      await repository.deleteByUserProfileId(profileAId);

    expect(first).toBe(false);

    await repository.save(
      createPreference(
        profileAId,
        "BOTH",
        [],
        [],
      ),
    );

    const second =
      await repository.deleteByUserProfileId(profileAId);

    const third =
      await repository.deleteByUserProfileId(profileAId);

    expect(second).toBe(true);
    expect(third).toBe(false);
  });

  // ==========================================================
  // TEST 11 — ROLLBACK DE LA TRANSACCIÓN
  // ==========================================================

  it("conserva las preferencias anteriores si falla el guardado", async () => {
    // --------------------------------------------------------
    // 1. GUARDAR CONFIGURACIÓN VÁLIDA
    // --------------------------------------------------------

    const original = await repository.save(
      createPreference(
        profileAId,
        "POSITIONS",
        [subjectAreaAId],
        ["A1"],
      ),
    );

    // --------------------------------------------------------
    // 2. PREPARAR UNA MATERIA INEXISTENTE
    // --------------------------------------------------------

    const invalidSubjectAreaId = 2147483647;

    // Comprobamos que realmente no exista en la DB.
    const existingSubject =
      await prisma.subjectArea.findUnique({
        where: {
          id: invalidSubjectAreaId,
        },
      });

    expect(existingSubject).toBeNull();

    // --------------------------------------------------------
    // 3. INTENTAR GUARDAR UNA CONFIGURACIÓN INCORRECTA
    // --------------------------------------------------------

    const invalid = createPreference(
      profileAId,
      "JOB_POOLS",
      [subjectAreaBId, invalidSubjectAreaId],
      ["C1", "C2"],
    );

    await expect(
      repository.save(invalid),
    ).rejects.toThrow();

    // --------------------------------------------------------
    // 4. COMPROBAR QUE NO SE PERDIERON DATOS
    // --------------------------------------------------------

    const result =
      await repository.findByUserProfileId(profileAId);

    expect(result?.id).toBe(original.id);

    expect(result?.selectionProcessType).toBe(
      "POSITIONS",
    );

    expect(result?.subjectAreaIds).toEqual([
      subjectAreaAId,
    ]);

    expect(result?.qualificationGroups).toEqual([
      "A1",
    ]);

    // --------------------------------------------------------
    // 5. VERIFICAR RELACIONES EN POSTGRESQL
    // --------------------------------------------------------

    const storedSubjects =
      await prisma.userPreferredSubjectArea.findMany({
        where: {
          professionalPreferenceId: original.id!,
        },
        select: {
          subjectAreaId: true,
        },
      });

    const storedGroups =
      await prisma.userPreferredQualificationGroup.findMany({
        where: {
          professionalPreferenceId: original.id!,
        },
        select: {
          qualificationGroup: true,
        },
      });

    expect(storedSubjects).toEqual([
      {
        subjectAreaId: subjectAreaAId,
      },
    ]);

    expect(storedGroups).toEqual([
      {
        qualificationGroup: "A1",
      },
    ]);
  });
});
