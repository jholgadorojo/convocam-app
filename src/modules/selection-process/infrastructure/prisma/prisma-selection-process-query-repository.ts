import { Prisma, type PrismaClient, } from "@/generated/prisma/client";
import type { SelectionProcessFilterOptions, SelectionProcessTerritoryOption, } from "../../application/selection-process-filter-options";
import type { SelectionProcessListItem } from "../../application/selection-process-list-item";
import type { SelectionProcessPage } from "../../application/selection-process-page";
import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";
import type { SelectionProcessApplicationPeriodFilter, SelectionProcessSearchFilters, SelectionProcessSort } from "../../application/selection-process-search-filters";
type SelectionProcessRow = Prisma.SelectionProcessGetPayload<{
  include: {
    institution: true;
  };
}>;
type TextSearchMatch = {
  id: number;
  score: number;
};
type InstitutionTerritoryRow = {
  municipality: string | null;
  county: string | null;
  province: string | null;
};
export class PrismaSelectionProcessQueryRepository implements SelectionProcessQueryRepository {
  constructor(private readonly prisma: PrismaClient) { }
  async findActive(page: number, pageSize: number, filters: SelectionProcessSearchFilters): Promise<SelectionProcessPage> {
    const skip = (page - 1) * pageSize;
    const qualificationGroups = normalizeStringArray(filters.qualificationGroup);
    const textMatches = filters.text
      ? await this.findTextMatches(filters.text)
      : null;
    if (textMatches !== null &&
      textMatches.length === 0) {
      return {
        items: [],
        page,
        pageSize,
        totalItems: 0,
        totalPages: 0,
      };
    }
    const conditions: Prisma.SelectionProcessWhereInput[] = [
      {
        sourceActive: true,
      },
    ];
    if (textMatches !== null) {
      conditions.push({
        id: {
          in: textMatches.map((match) => match.id),
        },
      });
    }
    if (qualificationGroups.length >
      0) {
      conditions.push({
        qualificationGroup: {
          in: qualificationGroups,
        },
      });
    }
    if (filters.isJobPool !==
      undefined) {
      conditions.push({
        isJobPool: filters.isJobPool,
      });
    }
    const statusIds =
      filters.statusId === undefined
        ? []
        : Array.isArray(filters.statusId)
          ? filters.statusId
          : [filters.statusId];

    if (statusIds.length > 0) {
      conditions.push({
        statusId: {
          in: statusIds,
        },
      });
    }
    const radiusKm = normalizeRadiusKm(filters.radiusKm);
    let nearbyInstitutionIds: number[] | null = null;
    if (filters.municipality && radiusKm) {
      nearbyInstitutionIds = await this.findInstitutionIdsWithinRadius({
        municipality: filters.municipality,
        county: filters.county,
        province: filters.province,
        radiusKm,
      });
    }
    if (nearbyInstitutionIds !== null) {
      conditions.push({
        institutionId: {
          in: nearbyInstitutionIds,
        },
      });
    }
    else if (filters.province ||
      filters.county ||
      filters.municipality) {
      conditions.push({
        institution: {
          is: {
            ...(filters.province
              ? {
                province: filters.province,
              }
              : {}),
            ...(filters.county
              ? {
                county: filters.county,
              }
              : {}),
            ...(filters.municipality
              ? {
                municipality: filters.municipality,
              }
              : {}),
          },
        },
      });
    }
    if (filters.scopeId !==
      undefined) {
      conditions.push({
        scopeId: filters.scopeId,
      });
    }
    if (filters.selectionSystemId !==
      undefined) {
      conditions.push({
        selectionSystemId: filters.selectionSystemId,
      });
    }
    if (filters.personnelTypeId !==
      undefined) {
      conditions.push({
        personnelTypeId: filters.personnelTypeId,
      });
    }
    if (filters.applicationPeriod) {
      conditions.push(buildApplicationPeriodWhereInput(
        filters.applicationPeriod,
        getCataloniaTodayUtc(),
      ));
    }
    if (filters.applicationEndDateFrom) {
      conditions.push({
        applicationEndDate: {
          gte: filters.applicationEndDateFrom,
        },
      });
    }
    if (filters.applicationEndDateTo) {
      conditions.push({
        applicationEndDate: {
          lte: filters.applicationEndDateTo,
        },
      });
    }
    if (filters.reservedDisability) {
      conditions.push({
        reservedDisabilityPositions: {
          gt: 0,
        },
      });
    }
    if (filters.reservedUnemployed) {
      conditions.push({
        reservedUnemployed: true,
      });
    }
    if (filters.reservedYoung) {
      conditions.push({
        reservedYoung: true,
      });
    }
    if (filters.reservedWomen) {
      conditions.push({
        reservedWomen: true,
      });
    }
    const where: Prisma.SelectionProcessWhereInput = {
      AND: conditions,
    };
    const sort = resolveSelectionProcessSort(filters.sort, textMatches !== null);
    if (textMatches !== null && sort === "relevance") {
      const [rows, totalItems,] = await Promise.all([
        this.prisma.selectionProcess.findMany({
          where,
          include: {
            institution: true,
          },
        }),
        this.prisma.selectionProcess.count({
          where,
        }),
      ]);
      const relevanceOrder = new Map<number, number>();
      textMatches.forEach((match, index) => {
        relevanceOrder.set(match.id, index);
      });
      rows.sort((first, second) => {
        const firstOrder = relevanceOrder.get(first.id) ??
          Number.MAX_SAFE_INTEGER;
        const secondOrder = relevanceOrder.get(second.id) ??
          Number.MAX_SAFE_INTEGER;
        return (firstOrder -
          secondOrder);
      });
      const paginatedRows = rows.slice(skip, skip +
        pageSize);
      return {
        items: paginatedRows.map((row) => mapSelectionProcessListItem(row)),
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems /
          pageSize),
      };
    }
    const orderBy = buildSelectionProcessOrderBy(sort);
    const [rows, totalItems,] = await Promise.all([
      this.prisma.selectionProcess.findMany({
        where,
        include: {
          institution: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.selectionProcess.count({
        where,
      }),
    ]);
    return {
      items: rows.map((row) => mapSelectionProcessListItem(row)),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems /
        pageSize),
    };
  }
  private async findInstitutionIdsWithinRadius({ municipality, county, province, radiusKm, }: {
    municipality: string;
    county?: string;
    province?: string;
    radiusKm: number;
  }): Promise<number[] | null> {
    const originInstitutions = await this.prisma.institution.findMany({
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
    const candidateInstitutions = await this.prisma.institution.findMany({
      where: {
        latitude: {
          not: null,
        },
        longitude: {
          not: null,
        },
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
      const distanceKm = calculateDistanceKm(originLatitude, originLongitude, institution.latitude.toNumber(), institution.longitude.toNumber());
      return distanceKm <= radiusKm ? [institution.id] : [];
    });
    const originInstitutionIds = originInstitutions.map((institution) => institution.id);
    return [
      ...new Set([
        ...originInstitutionIds,
        ...nearbyInstitutionIds,
      ]),
    ];
  }
  async getFilterOptions(): Promise<SelectionProcessFilterOptions> {
    const [institutionRows, statuses, scopes, selectionSystems, personnelTypes, qualificationGroups,] = await Promise.all([
      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
          institutionId: {
            not: null,
          },
        },
        select: {
          institution: {
            select: {
              municipality: true,
              county: true,
              province: true,
            },
          },
        },
      }),
      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
        },
        select: {
          statusId: true,
          status: true,
        },
        distinct: [
          "statusId",
          "status",
        ],
      }),
      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
        },
        select: {
          scopeId: true,
          scopeName: true,
        },
        distinct: [
          "scopeId",
          "scopeName",
        ],
      }),
      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
          selectionSystemId: {
            not: null,
          },
          selectionSystem: {
            not: null,
          },
        },
        select: {
          selectionSystemId: true,
          selectionSystem: true,
        },
        distinct: [
          "selectionSystemId",
          "selectionSystem",
        ],
      }),
      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
          personnelTypeId: {
            not: null,
          },
          personnelType: {
            not: null,
          },
        },
        select: {
          personnelTypeId: true,
          personnelType: true,
        },
        distinct: [
          "personnelTypeId",
          "personnelType",
        ],
      }),
      this.prisma.selectionProcess.findMany({
        where: {
          sourceActive: true,
          qualificationGroup: {
            not: null,
          },
        },
        select: {
          qualificationGroup: true,
        },
        distinct: [
          "qualificationGroup",
        ],
      }),
    ]);
    const institutions: InstitutionTerritoryRow[] = institutionRows
      .map((row) => row.institution)
      .filter((institution): institution is InstitutionTerritoryRow => institution !==
        null);
    const municipalities = uniqueSortedStrings(institutions.map((institution) => institution.municipality));
    const counties = uniqueSortedStrings(institutions.map((institution) => institution.county));
    const provinces = uniqueSortedStrings(institutions.map((institution) => institution.province));
    const territories = buildTerritories(institutions);
    return {
      municipalities,
      counties,
      provinces,
      territories,
      statuses: statuses
        .map((status) => ({
          id: status.statusId,
          name: status.status,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "ca")),
      scopes: scopes
        .map((scope) => ({
          id: scope.scopeId,
          name: scope.scopeName,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "ca")),
      selectionSystems: selectionSystems
        .filter((option) => option.selectionSystemId !==
          null &&
          option.selectionSystem !==
          null)
        .map((option) => ({
          id: option.selectionSystemId!,
          name: option.selectionSystem!,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "ca")),
      personnelTypes: personnelTypes
        .filter((option) => option.personnelTypeId !==
          null &&
          option.personnelType !==
          null)
        .map((option) => ({
          id: option.personnelTypeId!,
          name: option.personnelType!,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "ca")),
      qualificationGroups: uniqueSortedStrings(qualificationGroups.map((option) => option.qualificationGroup)),
    };
  }
  private async findTextMatches(text: string): Promise<TextSearchMatch[]> {
    const terms = text
      .trim()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);
    if (terms.length ===
      0) {
      return [];
    }
    const matchConditions = terms.map((term) => {
      const contains = `%${term}%`;
      return Prisma.sql`

            (

              unaccent(

                lower(

                  coalesce(

                    sp.title,

                    ''

                  )

                )

              )

                LIKE

              unaccent(

                lower(

                  ${contains}

                )

              )

              OR

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      sp.title,

                      ''

                    )

                  )

                )

              ) >= 0.55

              OR

              unaccent(

                lower(

                  coalesce(

                    i.name,

                    ''

                  )

                )

              )

                LIKE

              unaccent(

                lower(

                  ${contains}

                )

              )

              OR

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      i.name,

                      ''

                    )

                  )

                )

              ) >= 0.55

              OR

              unaccent(

                lower(

                  coalesce(

                    i.municipality,

                    ''

                  )

                )

              )

                LIKE

              unaccent(

                lower(

                  ${contains}

                )

              )

              OR

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      i.municipality,

                      ''

                    )

                  )

                )

              ) >= 0.55

              OR

              unaccent(

                lower(

                  coalesce(

                    i.county,

                    ''

                  )

                )

              )

                LIKE

              unaccent(

                lower(

                  ${contains}

                )

              )

              OR

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      i.county,

                      ''

                    )

                  )

                )

              ) >= 0.55

              OR

              unaccent(

                lower(

                  coalesce(

                    i.province,

                    ''

                  )

                )

              )

                LIKE

              unaccent(

                lower(

                  ${contains}

                )

              )

              OR

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      i.province,

                      ''

                    )

                  )

                )

              ) >= 0.55

              OR

              unaccent(

                lower(

                  coalesce(

                    sp."qualificationGroup",

                    ''

                  )

                )

              )

                LIKE

              unaccent(

                lower(

                  ${contains}

                )

              )

              OR

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      sp."qualificationGroup",

                      ''

                    )

                  )

                )

              ) >= 0.55

            )

          `;
    });
    const scoreExpressions = terms.map((term) => {
      const contains = `%${term}%`;
      return Prisma.sql`

            GREATEST(

              CASE

                WHEN

                  unaccent(

                    lower(

                      coalesce(

                        sp.title,

                        ''

                      )

                    )

                  )

                    LIKE

                  unaccent(

                    lower(

                      ${contains}

                    )

                  )

                THEN 2.0

                ELSE 0.0

              END,

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      sp.title,

                      ''

                    )

                  )

                )

              ) * 1.5,

              CASE

                WHEN

                  unaccent(

                    lower(

                      coalesce(

                        i.name,

                        ''

                      )

                    )

                  )

                    LIKE

                  unaccent(

                    lower(

                      ${contains}

                    )

                  )

                THEN 1.4

                ELSE 0.0

              END,

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      i.name,

                      ''

                    )

                  )

                )

              ) * 1.1,

              CASE

                WHEN

                  unaccent(

                    lower(

                      coalesce(

                        i.municipality,

                        ''

                      )

                    )

                  )

                    LIKE

                  unaccent(

                    lower(

                      ${contains}

                    )

                  )

                  OR

                  unaccent(

                    lower(

                      coalesce(

                        i.county,

                        ''

                      )

                    )

                  )

                    LIKE

                  unaccent(

                    lower(

                      ${contains}

                    )

                  )

                  OR

                  unaccent(

                    lower(

                      coalesce(

                        i.province,

                        ''

                      )

                    )

                  )

                    LIKE

                  unaccent(

                    lower(

                      ${contains}

                    )

                  )

                THEN 1.0

                ELSE 0.0

              END,

              GREATEST(

                word_similarity(

                  unaccent(

                    lower(

                      ${term}

                    )

                  ),

                  unaccent(

                    lower(

                      coalesce(

                        i.municipality,

                        ''

                      )

                    )

                  )

                ),

                word_similarity(

                  unaccent(

                    lower(

                      ${term}

                    )

                  ),

                  unaccent(

                    lower(

                      coalesce(

                        i.county,

                        ''

                      )

                    )

                  )

                ),

                word_similarity(

                  unaccent(

                    lower(

                      ${term}

                    )

                  ),

                  unaccent(

                    lower(

                      coalesce(

                        i.province,

                        ''

                      )

                    )

                  )

                )

              ) * 1.0,

              CASE

                WHEN

                  unaccent(

                    lower(

                      coalesce(

                        sp."qualificationGroup",

                        ''

                      )

                    )

                  )

                    LIKE

                  unaccent(

                    lower(

                      ${contains}

                    )

                  )

                THEN 0.8

                ELSE 0.0

              END,

              word_similarity(

                unaccent(

                  lower(

                    ${term}

                  )

                ),

                unaccent(

                  lower(

                    coalesce(

                      sp."qualificationGroup",

                      ''

                    )

                  )

                )

              ) * 0.7

            )

          `;
    });
    return this.prisma.$queryRaw<TextSearchMatch[]>(Prisma.sql`

        SELECT

          sp.id,

          (

            ${Prisma.join(scoreExpressions, " + ")}

          )::double precision

            AS score

        FROM

          "selection_processes" sp

        LEFT JOIN

          "institutions" i

            ON

              i.id =

              sp."institutionId"

        WHERE

          sp."sourceActive" = true

          AND

          ${Prisma.join(matchConditions, " AND ")}

        ORDER BY

          score DESC,

          sp.id ASC

      `);
  }
}
function mapSelectionProcessListItem(row: SelectionProcessRow): SelectionProcessListItem {
  return {
    id: row.id,
    cidoIdentifier: row.cidoIdentifier,
    title: row.title,
    isJobPool: row.isJobPool,
    statusId: row.statusId,
    status: row.status,
    applicationStartDate: row.applicationStartDate,
    applicationEndDate: row.applicationEndDate,
    numberOfPositions: row.numberOfPositions,
    qualificationGroup: row.qualificationGroup,
    personnelType: row.personnelType,
    selectionSystem: row.selectionSystem,
    scope: row.scopeName,
    reservedPlaces: {
      disability: row.reservedDisabilityPositions,
      unemployed: row.reservedUnemployed,
      youngPeople: row.reservedYoung,
      women: row.reservedWomen,
    },
    cidoUrl: row.cidoUrl,
    institution: row.institution
      ? {
        name: row.institution
          .name,
        municipality: row.institution
          .municipality,
        county: row.institution
          .county,
        province: row.institution
          .province,
      }
      : null,
  };
}
function buildApplicationPeriodWhereInput(period: SelectionProcessApplicationPeriodFilter, today: Date): Prisma.SelectionProcessWhereInput {
  switch (period) {
    case "open":
      return {
        AND: [
          {
            applicationStartDate: {
              lte: today,
            },
          },
          {
            applicationEndDate: {
              gte: today,
            },
          },
        ],
      };
    case "future":
      return {
        AND: [
          {
            applicationStartDate: {
              gt: today,
            },
          },
          {
            OR: [
              {
                applicationEndDate: null,
              },
              {
                applicationEndDate: {
                  gte: today,
                },
              },
            ],
          },
        ],
      };
    case "closed":
      return {
        applicationEndDate: {
          lt: today,
        },
      };
    case "unknown":
      return {
        OR: [
          {
            applicationStartDate: null,
            applicationEndDate: null,
          },
          {
            applicationStartDate: null,
            applicationEndDate: {
              gte: today,
            },
          },
          {
            applicationStartDate: {
              lte: today,
            },
            applicationEndDate: null,
          },
        ],
      };
  }
}
function getCataloniaTodayUtc(): Date {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(dateParts.find((part) => part.type === "year")?.value);
  const month = Number(dateParts.find((part) => part.type === "month")?.value);
  const day = Number(dateParts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day));
}
function resolveSelectionProcessSort(sort: SelectionProcessSort | undefined, hasTextSearch: boolean): SelectionProcessSort {
  if (sort === undefined) {
    return hasTextSearch
      ? "relevance"
      : "deadline-asc";
  }
  if (sort === "relevance" && !hasTextSearch) {
    return "deadline-asc";
  }
  return sort;
}
function buildSelectionProcessOrderBy(sort: SelectionProcessSort): Prisma.SelectionProcessOrderByWithRelationInput[] {
  switch (sort) {
    case "publication-desc":
      return [
        {
          lastDocumentPublicationDate: {
            sort: "desc",
            nulls: "last",
          },
        },
        {
          id: "asc",
        },
      ];
    case "deadline-desc":
      return [
        {
          applicationEndDate: {
            sort: "desc",
            nulls: "last",
          },
        },
        {
          id: "asc",
        },
      ];
    case "municipality-asc":
      return [
        {
          institution: {
            municipality: "asc",
          },
        },
        {
          applicationEndDate: {
            sort: "asc",
            nulls: "last",
          },
        },
        {
          id: "asc",
        },
      ];
    case "relevance":
    case "deadline-asc":
    default:
      return [
        {
          applicationEndDate: {
            sort: "asc",
            nulls: "last",
          },
        },
        {
          id: "asc",
        },
      ];
  }
}
function normalizeRadiusKm(value: number | undefined): number | undefined {
  if (value === undefined ||
    !Number.isFinite(value) ||
    value <= 0) {
    return undefined;
  }
  return value;
}
function calculateDistanceKm(latitude1: number, longitude1: number, latitude2: number, longitude2: number): number {
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
function normalizeStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  const values = Array.isArray(value)
    ? value
    : [value];
  return [
    ...new Set(values
      .map((item) => item.trim())
      .filter(Boolean)),
  ];
}
function uniqueSortedStrings(values: (string | null)[]): string[] {
  return [
    ...new Set(values
      .map((value) => value?.trim() ??
        "")
      .filter(Boolean)),
  ].sort((first, second) => first.localeCompare(second, "ca"));
}
function buildTerritories(institutions: InstitutionTerritoryRow[]): SelectionProcessTerritoryOption[] {
  const territories = new Map<string, SelectionProcessTerritoryOption>();
  for (const institution of institutions) {
    const province = institution.province?.trim();
    if (!province) {
      continue;
    }
    const county = institution.county?.trim() ||
      null;
    const municipality = institution.municipality?.trim() ||
      null;
    const key = [
      province,
      county ?? "",
      municipality ?? "",
    ].join("|");
    if (territories.has(key)) {
      continue;
    }
    territories.set(key, {
      province,
      county,
      municipality,
    });
  }
  return [
    ...territories.values(),
  ].sort((first, second) => {
    const provinceComparison = first.province.localeCompare(second.province, "ca");
    if (provinceComparison !==
      0) {
      return provinceComparison;
    }
    const countyComparison = (first.county ??
      "").localeCompare(second.county ??
        "", "ca");
    if (countyComparison !==
      0) {
      return countyComparison;
    }
    return (first.municipality ??
      "").localeCompare(second.municipality ??
        "", "ca");
  });
}
