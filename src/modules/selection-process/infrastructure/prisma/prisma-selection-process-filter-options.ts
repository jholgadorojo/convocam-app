import type { PrismaClient } from "@/generated/prisma/client";
import type {
  SelectionProcessFilterOptions,
  SelectionProcessTerritoryOption,
} from "../../application/selection-process-filter-options";

type InstitutionTerritoryRow = {
  municipality: string | null;
  county: string | null;
  province: string | null;
};

/**
 * Opciones de los filtros del buscador: solo los valores presentes
 * en convocatorias activas, ordenados alfabéticamente en catalán.
 */
export async function getSelectionProcessFilterOptions(
  prisma: PrismaClient,
): Promise<SelectionProcessFilterOptions> {
  const [
    institutionRows,
    statuses,
    scopes,
    selectionSystems,
    personnelTypes,
    qualificationGroups,
  ] = await Promise.all([
    prisma.selectionProcess.findMany({
      where: { sourceActive: true, institutionId: { not: null } },
      select: {
        institution: {
          select: { municipality: true, county: true, province: true },
        },
      },
    }),
    prisma.selectionProcess.findMany({
      where: { sourceActive: true },
      select: { statusId: true, status: true },
      distinct: ["statusId", "status"],
    }),
    prisma.selectionProcess.findMany({
      where: { sourceActive: true },
      select: { scopeId: true, scopeName: true },
      distinct: ["scopeId", "scopeName"],
    }),
    prisma.selectionProcess.findMany({
      where: {
        sourceActive: true,
        selectionSystemId: { not: null },
        selectionSystem: { not: null },
      },
      select: { selectionSystemId: true, selectionSystem: true },
      distinct: ["selectionSystemId", "selectionSystem"],
    }),
    prisma.selectionProcess.findMany({
      where: {
        sourceActive: true,
        personnelTypeId: { not: null },
        personnelType: { not: null },
      },
      select: { personnelTypeId: true, personnelType: true },
      distinct: ["personnelTypeId", "personnelType"],
    }),
    prisma.selectionProcess.findMany({
      where: { sourceActive: true, qualificationGroup: { not: null } },
      select: { qualificationGroup: true },
      distinct: ["qualificationGroup"],
    }),
  ]);
  const institutions: InstitutionTerritoryRow[] = institutionRows
    .map((row) => row.institution)
    .filter((institution): institution is InstitutionTerritoryRow => institution !== null);
  return {
    municipalities: uniqueSortedStrings(institutions.map((institution) => institution.municipality)),
    counties: uniqueSortedStrings(institutions.map((institution) => institution.county)),
    provinces: uniqueSortedStrings(institutions.map((institution) => institution.province)),
    territories: buildTerritories(institutions),
    statuses: sortByName(
      statuses.map((status) => ({ id: status.statusId, name: status.status })),
    ),
    scopes: sortByName(
      scopes.map((scope) => ({ id: scope.scopeId, name: scope.scopeName })),
    ),
    selectionSystems: sortByName(
      selectionSystems.flatMap((option) =>
        option.selectionSystemId !== null && option.selectionSystem !== null
          ? [{ id: option.selectionSystemId, name: option.selectionSystem }]
          : [],
      ),
    ),
    personnelTypes: sortByName(
      personnelTypes.flatMap((option) =>
        option.personnelTypeId !== null && option.personnelType !== null
          ? [{ id: option.personnelTypeId, name: option.personnelType }]
          : [],
      ),
    ),
    qualificationGroups: uniqueSortedStrings(
      qualificationGroups.map((option) => option.qualificationGroup),
    ),
  };
}

function sortByName<T extends { name: string }>(options: T[]): T[] {
  return options.sort((first, second) => first.name.localeCompare(second.name, "ca"));
}

function uniqueSortedStrings(values: (string | null)[]): string[] {
  return [
    ...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean)),
  ].sort((first, second) => first.localeCompare(second, "ca"));
}

/** Combinaciones provincia > comarca > municipio sin repetir, ordenadas. */
function buildTerritories(institutions: InstitutionTerritoryRow[]): SelectionProcessTerritoryOption[] {
  const territories = new Map<string, SelectionProcessTerritoryOption>();
  for (const institution of institutions) {
    const province = institution.province?.trim();
    if (!province) {
      continue;
    }
    const county = institution.county?.trim() || null;
    const municipality = institution.municipality?.trim() || null;
    const key = [province, county ?? "", municipality ?? ""].join("|");
    if (!territories.has(key)) {
      territories.set(key, { province, county, municipality });
    }
  }
  return [...territories.values()].sort(
    (first, second) =>
      first.province.localeCompare(second.province, "ca") ||
      (first.county ?? "").localeCompare(second.county ?? "", "ca") ||
      (first.municipality ?? "").localeCompare(second.municipality ?? "", "ca"),
  );
}
