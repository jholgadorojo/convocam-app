import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "../src/shared/infrastructure/database/prisma";

type TerritoryRow = {
  municipalityCode: string;
  municipalityName: string;
  countyCode: string;
  countyName: string;
  provinceCode: string;
  provinceName: string;
};

function readTerritories(): TerritoryRow[] {
  const filePath = join(
    process.cwd(),
    "prisma/data/idescat-territories.csv",
  );

  const content = readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "");

  const lines = content.split(/\r?\n/);

  if (!lines[3]?.startsWith("Codi municipi;Nom municipi;")) {
    throw new Error("La cabecera del CSV de Idescat no es válida");
  }

  return lines
    .slice(4)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const columns = line.split(";");

      if (columns.length !== 9 || columns[8].trim() !== "") {
        throw new Error(`Formato incorrecto en la línea ${index + 5}`);
      }

      const row: TerritoryRow = {
        municipalityCode: columns[0].trim(),
        municipalityName: columns[1].trim(),
        countyCode: columns[2].trim(),
        countyName: columns[3].trim(),
        provinceCode: columns[6].trim(),
        provinceName: columns[7].trim(),
      };

      if (
        !/^\d{6}$/.test(row.municipalityCode) ||
        !/^\d{2}$/.test(row.countyCode) ||
        !/^\d{2}$/.test(row.provinceCode) ||
        !row.municipalityName ||
        !row.countyName ||
        !row.provinceName
      ) {
        throw new Error(`Datos inválidos en la línea ${index + 5}`);
      }

      return row;
    });
}

async function main() {
  const territories = readTerritories();

  const provinces = new Map<string, string>();
  const counties = new Map<string, string>();
  const municipalityCodes = new Set<string>();

  for (const row of territories) {
    if (municipalityCodes.has(row.municipalityCode)) {
      throw new Error(`Municipio duplicado: ${row.municipalityCode}`);
    }

    municipalityCodes.add(row.municipalityCode);

    if (
      provinces.has(row.provinceCode) &&
      provinces.get(row.provinceCode) !== row.provinceName
    ) {
      throw new Error(`Provincia inconsistente: ${row.provinceCode}`);
    }

    if (
      counties.has(row.countyCode) &&
      counties.get(row.countyCode) !== row.countyName
    ) {
      throw new Error(`Comarca inconsistente: ${row.countyCode}`);
    }

    provinces.set(row.provinceCode, row.provinceName);
    counties.set(row.countyCode, row.countyName);
  }

  if (
    territories.length !== 947 ||
    provinces.size !== 4 ||
    counties.size !== 43
  ) {
    throw new Error("El catálogo territorial no está completo");
  }

  await prisma.$transaction(
    async (tx) => {
      const provinceIds = new Map<string, number>();
      const countyIds = new Map<string, number>();

      // 1. Provincias
      for (const [code, name] of provinces) {
        const province = await tx.province.upsert({
          where: { code },
          update: { name },
          create: { code, name },
        });

        provinceIds.set(code, province.id);
      }

      // 2. Comarcas
      for (const [code, name] of counties) {
        const county = await tx.county.upsert({
          where: { code },
          update: { name },
          create: { code, name },
        });

        countyIds.set(code, county.id);
      }

      // 3. Municipios
      for (const row of territories) {
        const provinceId = provinceIds.get(row.provinceCode);
        const countyId = countyIds.get(row.countyCode);

        if (provinceId === undefined || countyId === undefined) {
          throw new Error(
            `Relación territorial inválida: ${row.municipalityCode}`,
          );
        }

        const data = {
          name: row.municipalityName,
          provinceId,
          countyId,
        };

        await tx.municipality.upsert({
          where: { code: row.municipalityCode },
          update: data,
          create: {
            code: row.municipalityCode,
            ...data,
          },
        });
      }
    },
    {
      timeout: 120000,
    },
  );

  console.log("Catálogo territorial importado correctamente");
  console.log(`Provincias: ${provinces.size}`);
  console.log(`Comarcas y Aran: ${counties.size}`);
  console.log(`Municipios: ${territories.length}`);
}

main()
  .catch((error) => {
    console.error("Error importando Idescat:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });