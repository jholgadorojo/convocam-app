
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

import { PrismaTerritorialCatalogQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-territorial-catalog-query.repository";

import type { TerritorialSelection } from "@/modules/user-profile/domain/user-territorial-preference";

describe("PrismaTerritorialCatalogQueryRepository", () => {
  let prisma: PrismaClient | null = null;

  let repository: PrismaTerritorialCatalogQueryRepository;

  const prefix = `territorial-catalog-test-${randomUUID()}`;

  let provinceAId: number;
  let provinceBId: number;

  let countyAId: number;
  let countyBId: number;

  let municipalityAId: number;
  let municipalityBId: number;

  // ==========================================================
  // PREPARAR BASE DE DATOS Y TERRITORIOS
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
        "Las pruebas deben utilizar convocam_test",
      );
    }

    // Cliente exclusivo para la base de datos de pruebas.
    const adapter = new PrismaPg({
      connectionString,
    });

    prisma = new PrismaClient({ adapter });

    repository = new PrismaTerritorialCatalogQueryRepository(
      prisma,
    );

    // --------------------------------------------------------
    // CREAR DOS PROVINCIAS
    // --------------------------------------------------------

    const provinceA = await prisma.province.create({
      data: {
        code: `${prefix}-p1`,
        name: "Provincia de prueba A",
      },
    });

    const provinceB = await prisma.province.create({
      data: {
        code: `${prefix}-p2`,
        name: "Provincia de prueba B",
      },
    });

    provinceAId = provinceA.id;
    provinceBId = provinceB.id;

    // --------------------------------------------------------
    // CREAR DOS COMARCAS
    // --------------------------------------------------------

    const countyA = await prisma.county.create({
      data: {
        code: `${prefix}-c1`,
        name: "Comarca de prueba A",
      },
    });

    const countyB = await prisma.county.create({
      data: {
        code: `${prefix}-c2`,
        name: "Comarca de prueba B",
      },
    });

    countyAId = countyA.id;
    countyBId = countyB.id;

    // --------------------------------------------------------
    // CREAR DOS MUNICIPIOS
    // --------------------------------------------------------

    const municipalityA = await prisma.municipality.create({
      data: {
        code: `${prefix}-m1`,
        name: "Municipio de prueba A",
        countyId: countyAId,
        provinceId: provinceAId,
      },
    });

    const municipalityB = await prisma.municipality.create({
      data: {
        code: `${prefix}-m2`,
        name: "Municipio de prueba B",
        countyId: countyBId,
        provinceId: provinceBId,
      },
    });

    municipalityAId = municipalityA.id;
    municipalityBId = municipalityB.id;
  });

  // ==========================================================
  // LIMPIAR LOS TERRITORIOS DE PRUEBA
  // ==========================================================

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    try {
      // Primero los municipios, por sus claves externas.
      await prisma.municipality.deleteMany({
        where: {
          code: { startsWith: prefix },
        },
      });

      await prisma.county.deleteMany({
        where: {
          code: { startsWith: prefix },
        },
      });

      await prisma.province.deleteMany({
        where: {
          code: { startsWith: prefix },
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  // ==========================================================
  // TEST 1 — COMBINACIÓN DE TERRITORIOS
  // ==========================================================

  it("acepta provincias, comarcas y municipios existentes", async () => {
    const result = await repository.allTerritoriesExist({
      provinceIds: [provinceAId, provinceBId],
      countyIds: [countyAId],
      municipalityIds: [municipalityBId],
    });

    expect(result).toBe(true);
  });

  // ==========================================================
  // TEST 2 — SELECCIONES POR SEPARADO
  // ==========================================================

  it("acepta seleccionar solo provincias, comarcas o municipios", async () => {
    expect(
      await repository.allTerritoriesExist({
        provinceIds: [provinceAId],
        countyIds: [],
        municipalityIds: [],
      }),
    ).toBe(true);

    expect(
      await repository.allTerritoriesExist({
        provinceIds: [],
        countyIds: [countyAId],
        municipalityIds: [],
      }),
    ).toBe(true);

    expect(
      await repository.allTerritoriesExist({
        provinceIds: [],
        countyIds: [],
        municipalityIds: [municipalityAId],
      }),
    ).toBe(true);
  });

  // ==========================================================
  // TEST 3 — LISTAS VACÍAS
  // ==========================================================

  it("considera válida una consulta con listas vacías", async () => {
    const result = await repository.allTerritoriesExist({
      provinceIds: [],
      countyIds: [],
      municipalityIds: [],
    });

    expect(result).toBe(true);
  });

  // ==========================================================
  // TEST 4 — IDENTIFICADORES DUPLICADOS
  // ==========================================================

  it("acepta identificadores duplicados existentes", async () => {
    const result = await repository.allTerritoriesExist({
      provinceIds: [provinceAId, provinceAId],
      countyIds: [countyBId, countyBId],
      municipalityIds: [
        municipalityAId,
        municipalityAId,
      ],
    });

    expect(result).toBe(true);
  });

  // ==========================================================
  // TEST 5 — PROVINCIA INEXISTENTE
  // ==========================================================

  it("rechaza una provincia inexistente", async () => {
    const result = await repository.allTerritoriesExist({
      provinceIds: [2147483647],
      countyIds: [countyAId],
      municipalityIds: [],
    });

    expect(result).toBe(false);
  });

  // ==========================================================
  // TEST 6 — COMARCA INEXISTENTE
  // ==========================================================

  it("rechaza una comarca inexistente", async () => {
    const result = await repository.allTerritoriesExist({
      provinceIds: [provinceAId],
      countyIds: [2147483647],
      municipalityIds: [],
    });

    expect(result).toBe(false);
  });

  // ==========================================================
  // TEST 7 — MUNICIPIO INEXISTENTE
  // ==========================================================

  it("rechaza un municipio inexistente", async () => {
    const result = await repository.allTerritoriesExist({
      provinceIds: [],
      countyIds: [],
      municipalityIds: [2147483647],
    });

    expect(result).toBe(false);
  });

  // ==========================================================
  // TEST 8 — IDENTIFICADORES INCORRECTOS
  // ==========================================================

  it("rechaza identificadores inválidos", async () => {
    for (const invalidId of [
      0,
      -1,
      1.5,
      2147483648,
    ]) {
      const result =
        await repository.allTerritoriesExist({
          provinceIds: [invalidId],
          countyIds: [],
          municipalityIds: [],
        });

      expect(result).toBe(false);
    }
  });

  // ==========================================================
  // TEST 9 — ESTRUCTURA INCORRECTA
  // ==========================================================

  it("rechaza una selección mal formada", async () => {
    const invalid = {
      provinceIds: "incorrecto",
      countyIds: [],
      municipalityIds: [],
    } as unknown as TerritorialSelection;

    const result =
      await repository.allTerritoriesExist(invalid);

    expect(result).toBe(false);
  });
});
