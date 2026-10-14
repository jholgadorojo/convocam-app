
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

import { UserTerritorialPreference } from "@/modules/user-profile/domain/user-territorial-preference";

import { PrismaUserTerritorialPreferenceRepository } from "@/modules/user-profile/adapters/repositories/prisma-user-territorial-preference.repository";

describe(
  "PrismaUserTerritorialPreferenceRepository",
  () => {
    let prisma: PrismaClient;
    let repository: PrismaUserTerritorialPreferenceRepository;

    let profileAId: number;
    let profileBId: number;

    let provinceAId: number;
    let provinceBId: number;
    let countyAId: number;
    let countyBId: number;
    let municipalityAId: number;
    let municipalityBId: number;

    let testUserIds: string[] = [];
    let testProvinceIds: number[] = [];
    let testCountyIds: number[] = [];
    let testMunicipalityIds: number[] = [];

    // ========================================================
    // CONECTAR EXCLUSIVAMENTE A LA BASE DE TEST
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

      const databaseName = decodeURIComponent(
        new URL(databaseUrl).pathname.replace(/^\//, ""),
      );

      if (databaseName !== "convocam_test") {
        throw new Error(
          "Estas pruebas deben utilizar convocam_test",
        );
      }

      // Importación después de cargar .env.test
      const database = await import(
        "@/shared/infrastructure/database/prisma"
      );

      prisma = database.prisma;

      repository =
        new PrismaUserTerritorialPreferenceRepository(
          prisma,
        );
    });

    // ========================================================
    // PREPARAR USUARIOS Y TERRITORIOS DE PRUEBA
    // ========================================================

    beforeEach(async () => {
      const suffix = randomUUID();

      const userAId = `territorial-a-${suffix}`;
      const userBId = `territorial-b-${suffix}`;

      testUserIds = [userAId, userBId];
      testProvinceIds = [];
      testCountyIds = [];
      testMunicipalityIds = [];

      await prisma.user.createMany({
        data: [
          {
            id: userAId,
            name: "Usuario A",
            email: `territorial-a-${suffix}@example.test`,
          },
          {
            id: userBId,
            name: "Usuario B",
            email: `territorial-b-${suffix}@example.test`,
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

      // PROVINCIAS
      const provinceA = await prisma.province.create({
        data: {
          code: `test-pa-${suffix}`,
          name: "Provincia de prueba A",
        },
      });

      testProvinceIds.push(provinceA.id);

      const provinceB = await prisma.province.create({
        data: {
          code: `test-pb-${suffix}`,
          name: "Provincia de prueba B",
        },
      });

      testProvinceIds.push(provinceB.id);

      provinceAId = provinceA.id;
      provinceBId = provinceB.id;

      // COMARCAS
      const countyA = await prisma.county.create({
        data: {
          code: `test-ca-${suffix}`,
          name: "Comarca de prueba A",
        },
      });

      testCountyIds.push(countyA.id);

      const countyB = await prisma.county.create({
        data: {
          code: `test-cb-${suffix}`,
          name: "Comarca de prueba B",
        },
      });

      testCountyIds.push(countyB.id);

      countyAId = countyA.id;
      countyBId = countyB.id;

      // MUNICIPIOS
      const municipalityA = await prisma.municipality.create({
        data: {
          code: `test-ma-${suffix}`,
          name: "Municipio de prueba A",
          provinceId: provinceAId,
          countyId: countyAId,
        },
      });

      testMunicipalityIds.push(municipalityA.id);

      const municipalityB = await prisma.municipality.create({
        data: {
          code: `test-mb-${suffix}`,
          name: "Municipio de prueba B",
          provinceId: provinceBId,
          countyId: countyBId,
        },
      });

      testMunicipalityIds.push(municipalityB.id);

      municipalityAId = municipalityA.id;
      municipalityBId = municipalityB.id;
    });

    // ========================================================
    // LIMPIAR LOS DATOS DE PRUEBA
    // ========================================================

    afterEach(async () => {
      // Eliminar usuarios elimina en cascada sus perfiles
      // y las preferencias territoriales asociadas.
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });

      await prisma.municipality.deleteMany({
        where: {
          id: { in: testMunicipalityIds },
        },
      });

      await prisma.county.deleteMany({
        where: {
          id: { in: testCountyIds },
        },
      });

      await prisma.province.deleteMany({
        where: {
          id: { in: testProvinceIds },
        },
      });
    });

    afterAll(async () => {
      if (prisma) {
        await prisma.$disconnect();
      }
    });

    // ========================================================
    // MÉTODO AUXILIAR
    // ========================================================

    function createSelected(
      userProfileId: number,
      provinceIds: number[],
      countyIds: number[],
      municipalityIds: number[],
    ): UserTerritorialPreference {
      return UserTerritorialPreference
        .createSelectedTerritories(
          userProfileId,
          {
            provinceIds,
            countyIds,
            municipalityIds,
          },
        );
    }

    // ========================================================
    // TEST 1 — SIN CONFIGURAR
    // ========================================================

    it("devuelve null si no existen preferencias", async () => {
      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result).toBeNull();
    });

    // ========================================================
    // TEST 2 — TODA CATALUNYA
    // ========================================================

    it("guarda una preferencia para toda Catalunya", async () => {
      const preference =
        UserTerritorialPreference.createAllCatalonia(
          profileAId,
        );

      const saved = await repository.save(preference);

      expect(saved.id).toBeDefined();
      expect(saved.scope).toBe("ALL_CATALONIA");

      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result?.provinceIds).toEqual([]);
      expect(result?.countyIds).toEqual([]);
      expect(result?.municipalityIds).toEqual([]);
    });

    // ========================================================
    // TEST 3 — TERRITORIOS COMBINADOS
    // ========================================================

    it("guarda provincias, comarcas y municipios", async () => {
      const preference = createSelected(
        profileAId,
        [provinceAId, provinceBId],
        [countyAId],
        [municipalityBId],
      );

      await repository.save(preference);

      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result?.scope).toBe(
        "SELECTED_TERRITORIES",
      );

      expect(result?.provinceIds).toEqual([
        provinceAId,
        provinceBId,
      ]);

      expect(result?.countyIds).toEqual([countyAId]);

      expect(result?.municipalityIds).toEqual([
        municipalityBId,
      ]);
    });

    // ========================================================
    // TEST 4 — SUSTITUIR CONFIGURACIÓN
    // ========================================================

    it("actualiza las preferencias sin crear otra configuración", async () => {
      const first = await repository.save(
        createSelected(
          profileAId,
          [provinceAId],
          [countyAId],
          [municipalityAId],
        ),
      );

      const updated = await repository.save(
        createSelected(
          profileAId,
          [provinceBId],
          [countyBId],
          [municipalityBId],
        ),
      );

      expect(updated.id).toBe(first.id);

      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result?.provinceIds).toEqual([provinceBId]);
      expect(result?.countyIds).toEqual([countyBId]);
      expect(result?.municipalityIds).toEqual([
        municipalityBId,
      ]);

      const count =
        await prisma.userTerritorialPreference.count({
          where: { userProfileId: profileAId },
        });

      expect(count).toBe(1);
    });

    // ========================================================
    // TEST 5 — CAMBIAR A TODA CATALUNYA
    // ========================================================

    it("elimina los territorios al seleccionar toda Catalunya", async () => {
      const saved = await repository.save(
        createSelected(
          profileAId,
          [provinceAId],
          [countyAId],
          [municipalityAId],
        ),
      );

      saved.selectAllCatalonia();

      await repository.save(saved);

      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result?.scope).toBe("ALL_CATALONIA");
      expect(result?.provinceIds).toEqual([]);
      expect(result?.countyIds).toEqual([]);
      expect(result?.municipalityIds).toEqual([]);
    });

    // ========================================================
    // TEST 6 — CAMBIAR A SELECCIÓN DE TERRITORIOS
    // ========================================================

    it("permite pasar de toda Catalunya a territorios concretos", async () => {
      const saved = await repository.save(
        UserTerritorialPreference.createAllCatalonia(
          profileAId,
        ),
      );

      saved.selectTerritories({
        provinceIds: [],
        countyIds: [countyAId],
        municipalityIds: [municipalityAId],
      });

      await repository.save(saved);

      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result?.scope).toBe(
        "SELECTED_TERRITORIES",
      );

      expect(result?.countyIds).toEqual([countyAId]);
      expect(result?.municipalityIds).toEqual([
        municipalityAId,
      ]);
    });

    // ========================================================
    // TEST 7 — AISLAMIENTO ENTRE PERFILES
    // ========================================================

    it("mantiene independientes las preferencias de dos usuarios", async () => {
      await repository.save(
        createSelected(
          profileAId,
          [provinceAId],
          [],
          [],
        ),
      );

      await repository.save(
        createSelected(
          profileBId,
          [],
          [countyBId],
          [],
        ),
      );

      const first =
        await repository.findByUserProfileId(profileAId);

      const second =
        await repository.findByUserProfileId(profileBId);

      expect(first?.provinceIds).toEqual([provinceAId]);
      expect(first?.countyIds).toEqual([]);

      expect(second?.provinceIds).toEqual([]);
      expect(second?.countyIds).toEqual([countyBId]);
    });

    // ========================================================
    // TEST 8 — ELIMINAR
    // ========================================================

    it("elimina las preferencias sin afectar a otro usuario", async () => {
      await repository.save(
        UserTerritorialPreference.createAllCatalonia(
          profileAId,
        ),
      );

      await repository.save(
        UserTerritorialPreference.createAllCatalonia(
          profileBId,
        ),
      );

      const deleted =
        await repository.deleteByUserProfileId(profileAId);

      expect(deleted).toBe(true);

      expect(
        await repository.findByUserProfileId(profileAId),
      ).toBeNull();

      expect(
        await repository.findByUserProfileId(profileBId),
      ).not.toBeNull();

      expect(
        await repository.deleteByUserProfileId(profileAId),
      ).toBe(false);
    });

    // ========================================================
    // TEST 9 — IMPEDIR UTILIZAR OTRO IDENTIFICADOR
    // ========================================================

    it("impide actualizar con el identificador de otro perfil", async () => {
      const first = await repository.save(
        UserTerritorialPreference.createAllCatalonia(
          profileAId,
        ),
      );

      await repository.save(
        UserTerritorialPreference.createAllCatalonia(
          profileBId,
        ),
      );

      const invalid = UserTerritorialPreference.restore({
        id: first.id!,
        userProfileId: profileBId,
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      });

      await expect(
        repository.save(invalid),
      ).rejects.toThrow(
        "Las preferencias no pertenecen al perfil indicado",
      );

      const original =
        await repository.findByUserProfileId(profileAId);

      expect(original?.id).toBe(first.id);
      expect(original?.scope).toBe("ALL_CATALONIA");
    });

    // ========================================================
    // TEST 10 — ROLLBACK DE LA TRANSACCIÓN
    // ========================================================

    it("conserva las preferencias anteriores si falla el guardado", async () => {
      const original = await repository.save(
        createSelected(
          profileAId,
          [provinceAId],
          [countyAId],
          [municipalityAId],
        ),
      );

      // Este identificador no existe en el catálogo
      // de municipios de la base de datos de pruebas.
      const nonExistentMunicipalityId = 2147483647;

      const invalid = createSelected(
        profileAId,
        [provinceBId],
        [countyBId],
        [nonExistentMunicipalityId],
      );

      await expect(
        repository.save(invalid),
      ).rejects.toThrow();

      // La transacción debe deshacer TODOS los cambios.
      const result =
        await repository.findByUserProfileId(profileAId);

      expect(result?.id).toBe(original.id);

      expect(result?.provinceIds).toEqual([
        provinceAId,
      ]);

      expect(result?.countyIds).toEqual([
        countyAId,
      ]);

      expect(result?.municipalityIds).toEqual([
        municipalityAId,
      ]);
    });
  },
);
