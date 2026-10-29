import type { PrismaClient } from "@/generated/prisma/client";
import type { SelectionProcessTerritorialIds } from "../../application/selection-process-search-filters";

/**
 * Filtros territoriales que se resuelven a identificadores de
 * institución antes de construir el `where` de la consulta.
 */

/**
 * Resolve territory catalog IDs (SPEC-007) to CIDO institution IDs.
 *
 * Province, county and municipality selections are alternatives (OR).
 * The returned IDs are applied to the Prisma `where` BEFORE pagination.
 *
 * CIDO institution identifiers are not always municipality identifiers,
 * so the municipality name is also checked with its county and province.
 * This is about institution location, not necessarily the job location.
 */
export async function findInstitutionIdsMatchingTerritories(
  prisma: PrismaClient,
  territorialIds: SelectionProcessTerritorialIds,
): Promise<number[]> {
  const provinceIds = uniquePositiveIntegerIds(territorialIds.provinceIds);
  const countyIds = uniquePositiveIntegerIds(territorialIds.countyIds);
  const municipalityIds = uniquePositiveIntegerIds(territorialIds.municipalityIds);
  if (
    provinceIds.length === 0 &&
    countyIds.length === 0 &&
    municipalityIds.length === 0
  ) {
    return [];
  }
  const [provinces, counties, municipalities, institutions] = await Promise.all([
    prisma.province.findMany({
      where: { id: { in: provinceIds } },
      select: { code: true, name: true },
    }),
    prisma.county.findMany({
      where: { id: { in: countyIds } },
      select: { code: true, name: true },
    }),
    prisma.municipality.findMany({
      where: { id: { in: municipalityIds } },
      select: {
        code: true,
        name: true,
        county: { select: { name: true } },
        province: { select: { name: true } },
      },
    }),
    prisma.institution.findMany({
      select: {
        id: true,
        ineCode: true,
        countyCode: true,
        provinceCode: true,
        municipality: true,
        county: true,
        province: true,
      },
    }),
  ]);
  const provinceCodes = new Set(provinces.map((province) => province.code));
  const provinceNames = new Set(
    provinces.map((province) => normalizeTerritoryName(province.name)),
  );
  const countyCodes = new Set(counties.map((county) => county.code));
  const countyNames = new Set(
    counties.map((county) => normalizeTerritoryName(county.name)),
  );
  const municipalityCodes = new Set(
    municipalities.map((municipality) => municipality.code),
  );
  const municipalityLocations = new Set(
    municipalities.map((municipality) => territoryLocationKey(
      municipality.name,
      municipality.county.name,
      municipality.province.name,
    )),
  );
  return institutions
    .filter((institution) => {
      const provinceCode = extractCidoAreaCode(institution.provinceCode, "800");
      const countyCode = extractCidoAreaCode(institution.countyCode, "810");
      const municipalityCode = extractCidoMunicipalityCode(institution.ineCode);
      const matchesProvince =
        (provinceCode !== null && provinceCodes.has(provinceCode)) ||
        provinceNames.has(normalizeTerritoryName(institution.province));
      const matchesCounty =
        (countyCode !== null && countyCodes.has(countyCode)) ||
        countyNames.has(normalizeTerritoryName(institution.county));
      const matchesMunicipality =
        (municipalityCode !== null && municipalityCodes.has(municipalityCode)) ||
        municipalityLocations.has(territoryLocationKey(
          institution.municipality,
          institution.county,
          institution.province,
        ));
      return matchesProvince || matchesCounty || matchesMunicipality;
    })
    .map((institution) => institution.id);
}

/**
 * Instituciones a `radiusKm` o menos (en línea recta) del municipio
 * indicado, incluidas las del propio municipio. El origen es el
 * centro de las instituciones del municipio con coordenadas; si
 * ninguna tiene, devuelve null y se filtra solo por el municipio.
 */
export async function findInstitutionIdsWithinRadius(
  prisma: PrismaClient,
  { municipality, county, province, radiusKm }: {
    municipality: string;
    county?: string;
    province?: string;
    radiusKm: number;
  },
): Promise<number[] | null> {
  const originInstitutions = await prisma.institution.findMany({
    where: {
      municipality,
      ...(county ? { county } : {}),
      ...(province ? { province } : {}),
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  });
  const originPoints = originInstitutions.flatMap((institution) => {
    if (institution.latitude === null || institution.longitude === null) {
      return [];
    }
    return [
      {
        latitude: institution.latitude.toNumber(),
        longitude: institution.longitude.toNumber(),
      },
    ];
  });
  if (originPoints.length === 0) {
    return null;
  }
  const originLatitude = originPoints.reduce((total, point) => total + point.latitude, 0) /
    originPoints.length;
  const originLongitude = originPoints.reduce((total, point) => total + point.longitude, 0) /
    originPoints.length;
  const candidateInstitutions = await prisma.institution.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  });
  const nearbyInstitutionIds = candidateInstitutions.flatMap((institution) => {
    if (institution.latitude === null || institution.longitude === null) {
      return [];
    }
    const distanceKm = calculateDistanceKm(
      originLatitude,
      originLongitude,
      institution.latitude.toNumber(),
      institution.longitude.toNumber(),
    );
    return distanceKm <= radiusKm ? [institution.id] : [];
  });
  const originInstitutionIds = originInstitutions.map((institution) => institution.id);
  return [...new Set([...originInstitutionIds, ...nearbyInstitutionIds])];
}

/** Radio en km válido (positivo y finito) o undefined. */
export function normalizeRadiusKm(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

function uniquePositiveIntegerIds(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
}

function normalizeTerritoryName(value: string | null): string {
  return value?.trim().toLocaleLowerCase("ca") ?? "";
}

/** An exact municipality / county / province combination for safe fallback. */
function territoryLocationKey(
  municipality: string | null,
  county: string | null,
  province: string | null,
): string {
  const parts = [municipality, county, province].map(normalizeTerritoryName);
  return parts.every(Boolean) ? parts.join("\u001f") : "";
}

/** Municipal CIDO codes are commonly 9 or 10 digits, with a leading zero omitted. */
function normalizeCidoTerritorialCode(value: string | null): string | null {
  const raw = value?.trim();
  if (!raw || !/^\d{9,10}$/.test(raw)) {
    return null;
  }
  return raw.padStart(10, "0");
}

/** CIDO provincial codes have prefix 800; county codes have prefix 810. */
function extractCidoAreaCode(value: string | null, prefix: "800" | "810"): string | null {
  const code = normalizeCidoTerritorialCode(value);
  return code?.startsWith(prefix) ? code.slice(3, 5) : null;
}

/** Only codes with an Idescat Catalan province prefix can identify a municipality. */
function extractCidoMunicipalityCode(value: string | null): string | null {
  const code = normalizeCidoTerritorialCode(value);
  if (!code) {
    return null;
  }
  const municipalityCode = code.slice(0, 6);
  return ["08", "17", "25", "43"].includes(municipalityCode.slice(0, 2))
    ? municipalityCode
    : null;
}

/** Distancia en línea recta entre dos coordenadas (fórmula del haversine). */
function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const EARTH_RADIUS_KM = 6371;
  const latitudeDifference = degreesToRadians(latitude2 - latitude1);
  const longitudeDifference = degreesToRadians(longitude2 - longitude1);
  const latitude1Radians = degreesToRadians(latitude1);
  const latitude2Radians = degreesToRadians(latitude2);
  const haversine = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitude1Radians) *
    Math.cos(latitude2Radians) *
    Math.sin(longitudeDifference / 2) ** 2;
  const angularDistance = 2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_KM * angularDistance;
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
