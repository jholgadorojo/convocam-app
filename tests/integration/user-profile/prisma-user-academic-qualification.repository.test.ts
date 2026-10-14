
import { randomUUID } from "node:crypto";

import { config } from "dotenv";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { UserAcademicQualification } from "@/modules/user-profile/domain/user-academic-qualification";

import { PrismaUserAcademicQualificationRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-academic-qualification.repository";

describe(
  "PrismaUserAcademicQualificationRepository",
  () => {
    let prisma: PrismaClient;

    let repository: PrismaUserAcademicQualificationRepository;

    let profileAId: number;
    let profileBId: number;

    let testUserIds: string[] = [];

    // ========================================================
    // CONEXIÓN A LA BASE DE DATOS DE TEST
    // ========================================================

    beforeAll(async () => {
      config({
        path: ".env.test",
        override: true,
      });

      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error(
          "DATABASE_URL no está configurada",
        );
      }

      const databaseName = new URL(
        databaseUrl,
      ).pathname.replace(/^\//, "");

      if (databaseName !== "convocam_test") {
        throw new Error(
          "Las pruebas deben utilizar la base de datos convocam_test",
        );
      }

      // Importamos Prisma después de cargar .env.test
      const database = await import(
        "@/shared/infrastructure/database/prisma"
      );

      prisma = database.prisma;

      repository =
        new PrismaUserAcademicQualificationRepository(
          prisma,
        );
    });

    // ========================================================
    // PREPARAR DOS USUARIOS Y SUS PERFILES
    // ========================================================

    beforeEach(async () => {
      const suffix = randomUUID();

      const userAId = `academic-test-a-${suffix}`;
      const userBId = `academic-test-b-${suffix}`;

      testUserIds = [userAId, userBId];

      await prisma.user.createMany({
        data: [
          {
            id: userAId,
            name: "Usuario A",
            email: `academic-a-${suffix}@example.test`,
          },
          {
            id: userBId,
            name: "Usuario B",
            email: `academic-b-${suffix}@example.test`,
          },
        ],
      });

      const profileA = await prisma.userProfile.create({
        data: {
          userId: userAId,
          firstName: "Usuario",
          lastName: "A",
        },
      });

      const profileB = await prisma.userProfile.create({
        data: {
          userId: userBId,
          firstName: "Usuario",
          lastName: "B",
        },
      });

      profileAId = profileA.id;
      profileBId = profileB.id;
    });

    // ========================================================
    // LIMPIAR REGISTROS DE PRUEBA
    // ========================================================

    afterEach(async () => {
      if (testUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: {
              in: testUserIds,
            },
          },
        });
      }

      testUserIds = [];
    });

    afterAll(async () => {
      if (prisma) {
        await prisma.$disconnect();
      }
    });

    // ========================================================
    // MÉTODO AUXILIAR
    // ========================================================

    function createQualification(
      userProfileId: number,
      name = "Educación Secundaria Obligatoria",
    ): UserAcademicQualification {
      return UserAcademicQualification.create({
        userProfileId,
        qualificationType: "ESO",
        name,
      });
    }

    // ========================================================
    // TEST 1 — CREAR
    // ========================================================

    it("crea una titulación en PostgreSQL", async () => {
      const qualification = createQualification(
        profileAId,
      );

      const saved = await repository.save(
        qualification,
      );

      expect(saved.id).toBeDefined();
      expect(saved.userProfileId).toBe(profileAId);
      expect(saved.qualificationType).toBe("ESO");

      const record =
        await prisma.userAcademicQualification.findUnique({
          where: {
            id: saved.id,
          },
        });

      expect(record).not.toBeNull();
      expect(record?.name).toBe(
        "Educación Secundaria Obligatoria",
      );
    });

    // ========================================================
    // TEST 2 — LISTAR
    // ========================================================

    it("lista únicamente las titulaciones de un perfil", async () => {
      await repository.save(
        createQualification(profileAId, "ESO"),
      );

      await repository.save(
        createQualification(profileAId, "Bachillerato"),
      );

      await repository.save(
        createQualification(profileBId, "Otra titulación"),
      );

      const result =
        await repository.listByUserProfileId(
          profileAId,
        );

      expect(result).toHaveLength(2);

      expect(
        result.map((item) => item.name),
      ).toEqual([
        "ESO",
        "Bachillerato",
      ]);
    });

    // ========================================================
    // TEST 3 — CONSULTA SEGURA
    // ========================================================

    it("impide consultar una titulación de otro perfil", async () => {
      const saved = await repository.save(
        createQualification(profileAId),
      );

      const result =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          profileBId,
        );

      expect(result).toBeNull();
    });

    // ========================================================
    // TEST 4 — ACTUALIZAR
    // ========================================================

    it("actualiza una titulación correctamente", async () => {
      const saved = await repository.save(
        createQualification(profileAId),
      );

      saved.changeDetails(
        "UNIVERSITY_DEGREE",
        "Ingeniería Informática",
      );

      await repository.save(saved);

      const updated =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          profileAId,
        );

      expect(updated?.qualificationType).toBe(
        "UNIVERSITY_DEGREE",
      );

      expect(updated?.name).toBe(
        "Ingeniería Informática",
      );
    });

    // ========================================================
    // TEST 5 — IMPEDIR MODIFICAR OTRO PERFIL
    // ========================================================

    it("impide modificar una titulación de otro perfil", async () => {
      const saved = await repository.save(
        createQualification(profileAId, "ESO"),
      );

      const invalid =
        UserAcademicQualification.restore({
          id: saved.id!,
          userProfileId: profileBId,
          qualificationType: "DOCTORATE",
          name: "Modificación no autorizada",
        });

      await expect(
        repository.save(invalid),
      ).rejects.toThrow();

      const original =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          profileAId,
        );

      expect(original?.name).toBe("ESO");
      expect(original?.qualificationType).toBe("ESO");
    });

    // ========================================================
    // TEST 6 — ELIMINAR
    // ========================================================

    it("elimina una titulación de su perfil", async () => {
      const saved = await repository.save(
        createQualification(profileAId),
      );

      const deleted =
        await repository.deleteByIdAndUserProfileId(
          saved.id!,
          profileAId,
        );

      expect(deleted).toBe(true);

      const result =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          profileAId,
        );

      expect(result).toBeNull();
    });

    // ========================================================
    // TEST 7 — IMPEDIR ELIMINAR OTRO PERFIL
    // ========================================================

    it("impide eliminar una titulación de otro perfil", async () => {
      const saved = await repository.save(
        createQualification(profileAId),
      );

      const deleted =
        await repository.deleteByIdAndUserProfileId(
          saved.id!,
          profileBId,
        );

      expect(deleted).toBe(false);

      const original =
        await repository.findByIdAndUserProfileId(
          saved.id!,
          profileAId,
        );

      expect(original).not.toBeNull();
    });

    // ========================================================
    // TEST 8 — ELIMINAR REGISTRO INEXISTENTE
    // ========================================================

    it("devuelve false si la titulación no existe", async () => {
      const deleted =
        await repository.deleteByIdAndUserProfileId(
          999999999,
          profileAId,
        );

      expect(deleted).toBe(false);
    });
  },
);
