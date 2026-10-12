import "dotenv/config";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";
import { PrismaMunicipalityQueryRepository } from "@/modules/user-profile/adapters/repositories/prisma-municipality-query.repository";

describe("PrismaMunicipalityQueryRepository", () => {
  const repository = new PrismaMunicipalityQueryRepository(prisma);

  let provinceId: number | undefined;
  let countyId: number | undefined;
  let municipalityId: number | undefined;

  beforeAll(async () => {
    // Comprobar que estamos utilizando la base de datos de pruebas
    const database = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT current_database() AS name
    `;

    if (database[0]?.name !== "convocam_test") {
      throw new Error("Los tests deben utilizar convocam_test");
    }

    const uniqueCode = randomUUID();

    // Crear provincia de prueba
    const province = await prisma.province.create({
      data: {
        code: `test-province-${uniqueCode}`,
        name: "Provincia Test",
      },
    });

    provinceId = province.id;

    // Crear comarca de prueba
    const county = await prisma.county.create({
      data: {
        code: `test-county-${uniqueCode}`,
        name: "Comarca Test",
      },
    });

    countyId = county.id;

    // Crear municipio de prueba
    const municipality = await prisma.municipality.create({
      data: {
        code: `test-municipality-${uniqueCode}`,
        name: "Municipio Test",
        provinceId,
        countyId,
      },
    });

    municipalityId = municipality.id;
  });

  afterAll(async () => {
    // Eliminar los datos de prueba respetando las relaciones
    if (municipalityId !== undefined) {
      await prisma.municipality.delete({
        where: { id: municipalityId },
      });
    }

    if (countyId !== undefined) {
      await prisma.county.delete({
        where: { id: countyId },
      });
    }

    if (provinceId !== undefined) {
      await prisma.province.delete({
        where: { id: provinceId },
      });
    }
  });

  it("devuelve true cuando el municipio existe", async () => {
    const exists = await repository.existsById(municipalityId!);

    expect(exists).toBe(true);
  });

  it("devuelve false cuando el municipio no existe", async () => {
    const exists = await repository.existsById(-1);

    expect(exists).toBe(false);
  });

  it("lista los municipios con su comarca y provincia", async () => {
    const municipalities = await repository.listAll();

    const municipality = municipalities.find(
      (item) => item.id === municipalityId,
    );

    expect(municipality).toBeDefined();

    expect(municipality).toMatchObject({
      id: municipalityId,
      name: "Municipio Test",
      countyName: "Comarca Test",
      provinceName: "Provincia Test",
    });

    expect(municipality?.code).toMatch(/^test-municipality-/);
  });
});