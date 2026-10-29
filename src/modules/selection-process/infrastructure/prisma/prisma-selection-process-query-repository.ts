import { Prisma, type PrismaClient, } from "@/generated/prisma/client";
import type { SelectionProcessFilterOptions } from "../../application/selection-process-filter-options";
import type { SelectionProcessListItem } from "../../application/selection-process-list-item";
import type { SelectionProcessMunicipalityMapPoint } from "../../application/selection-process-municipality-map-point";
import type { SelectionProcessPage } from "../../application/selection-process-page";
import type { SelectionProcessQueryRepository } from "../../application/selection-process-query-repository";
import {
  resolveSelectionProcessSort,
  type SelectionProcessApplicationPeriodFilter,
  type SelectionProcessSearchFilters,
  type SelectionProcessSort,
} from "../../application/selection-process-search-filters";
import { getCataloniaCalendarDate } from "@/shared/utils/catalonia-calendar-date";
import { getSelectionProcessFilterOptions } from "./prisma-selection-process-filter-options";
import { findTextMatches, type TextSearchMatch } from "./selection-process-text-search";
import {
  findInstitutionIdsMatchingTerritories,
  findInstitutionIdsWithinRadius,
  normalizeRadiusKm,
} from "./selection-process-territory-filters";

/*
 * Consultas de lectura del buscador, «Para mí» y el mapa (SPEC-004,
 * SPEC-008, SPEC-010). La búsqueda de texto, los filtros territoriales
 * y las opciones de los filtros están en sus propios archivos.
 */

type SelectionProcessRow = Prisma.SelectionProcessGetPayload<{
  include: {
    institution: true;
  };
}>;
type OrderedGroup = {
  where: Prisma.SelectionProcessWhereInput;
  count: number;
  orderBy: Prisma.SelectionProcessOrderByWithRelationInput[];
};
export class PrismaSelectionProcessQueryRepository implements SelectionProcessQueryRepository {
  constructor(private readonly prisma: PrismaClient) { }
  async findActive(page: number, pageSize: number, filters: SelectionProcessSearchFilters): Promise<SelectionProcessPage> {
    const skip = (page - 1) * pageSize;
    const { where, textMatches } = await this.buildActiveWhere(filters);
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
// SPEC-008: priority ordering is implemented in PostgreSQL in groups.
// The existing SPEC-004 sort orders remain unchanged.
    if (sort === "deadline-priority") {
      return this.findDeadlinePriorityPage(page, pageSize, skip, where);
    }
    // Plazo: finaliza antes. Pendientes primero; las finalizadas, al final.
    if (sort === "deadline-asc") {
      return this.findDeadlineAscPage(page, pageSize, skip, where);
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
  /**
   * SPEC-010 / Para mi: municipios de TODAS las convocatorias coincidentes.
   *
   * No usa paginacion: el mapa no debe depender de la pagina visible.
   * Se reutiliza exactamente el mismo filtro que findActive(), incluyendo
   * las preferencias territoriales/profesionales del usuario.
   *
   * La base de datos cuenta convocatorias por institucion, y aqui se
   * combinan esas cantidades por municipio y provincia.
   */
  async listMunicipalityMapPoints(
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessMunicipalityMapPoint[]> {
    const { where, textMatches } = await this.buildActiveWhere(filters);
    if (textMatches !== null && textMatches.length === 0) {
      return [];
    }

    // Un registro por institucion, no uno por convocatoria.
    const institutionCounts = await this.prisma.selectionProcess.groupBy({
      by: ["institutionId"],
      where,
      _count: { _all: true },
    });

    const institutionIds = institutionCounts.flatMap((entry) =>
      entry.institutionId === null ? [] : [entry.institutionId],
    );
    if (institutionIds.length === 0) {
      return [];
    }

    const institutions = await this.prisma.institution.findMany({
      where: { id: { in: institutionIds } },
      select: {
        id: true,
        municipality: true,
        province: true,
        latitude: true,
        longitude: true,
      },
    });
    const institutionById = new Map(
      institutions.map((institution) => [institution.id, institution]),
    );

    type MunicipalitySummary = {
      municipality: string;
      province: string;
      count: number;
      latitudeSum: number;
      longitudeSum: number;
      coordinateWeight: number;
    };
    const municipalities = new Map<string, MunicipalitySummary>();

    for (const entry of institutionCounts) {
      if (entry.institutionId === null) continue;
      const institution = institutionById.get(entry.institutionId);
      if (!institution) continue;
      const municipality = institution.municipality?.trim();
      if (!municipality) continue;

      const province = institution.province?.trim() ?? "";
      const key = `${municipality.toLocaleLowerCase("ca-ES")}::${province.toLocaleLowerCase("ca-ES")}`;
      let group = municipalities.get(key);
      if (!group) {
        group = {
          municipality,
          province,
          count: 0,
          latitudeSum: 0,
          longitudeSum: 0,
          coordinateWeight: 0,
        };
        municipalities.set(key, group);
      }

      const count = entry._count._all;
      group.count += count;

      // Las coordenadas de CIDO son Prisma.Decimal (y pueden ser null).
      // Los procesos sin coordenadas tambien cuentan en el municipio;
      // solo se excluye el punto si ninguna institucion tiene coordenadas.
      const latitude = institution.latitude?.toNumber();
      const longitude = institution.longitude?.toNumber();
      if (
        latitude !== undefined &&
        longitude !== undefined &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= 40.4 && latitude <= 43 &&
        longitude >= 0 && longitude <= 3.5
      ) {
        group.latitudeSum += latitude * count;
        group.longitudeSum += longitude * count;
        group.coordinateWeight += count;
      }
    }

    return [...municipalities.values()]
      .filter((group) => group.coordinateWeight > 0)
      .map((group) => ({
        municipality: group.municipality,
        province: group.province,
        latitude: group.latitudeSum / group.coordinateWeight,
        longitude: group.longitudeSum / group.coordinateWeight,
        count: group.count,
      }))
      .sort(
        (a, b) =>
          a.municipality.localeCompare(b.municipality, "ca") ||
          a.province.localeCompare(b.province, "ca"),
      );
  }

  /**
   * Las consultas de listado y mapa comparten este unico filtro Prisma.
   * Evita diferencias en conteos, preferencias y estados oficiales.
   */
  private async buildActiveWhere(
    filters: SelectionProcessSearchFilters,
  ): Promise<{
    where: Prisma.SelectionProcessWhereInput;
    textMatches: TextSearchMatch[] | null;
  }> {
    const qualificationGroups = normalizeStringArray(filters.qualificationGroup);
    const subjectAreaIds = [
      ...new Set(
        (filters.subjectAreaIds ?? []).filter(
          (id) => Number.isInteger(id) && id > 0,
        ),
      ),
    ];
    const textMatches = filters.text
      ? await findTextMatches(this.prisma, filters.text)
      : null;
    if (textMatches !== null && textMatches.length === 0) {
      return { where: { id: { in: [] } }, textMatches };
    }
    const conditions: Prisma.SelectionProcessWhereInput[] = [
      {
        sourceActive: true,
      },
    ];
// SPEC-009: excluir convocatorias seguidas antes de contar y paginar.
    if (filters.excludeFollowedByUserId !== undefined) {
      const userId = filters.excludeFollowedByUserId.trim();
      if (!userId) {
        throw new Error("excludeFollowedByUserId must not be empty");
      }
      conditions.push({
        userSelectionProcesses: {
          none: {
            userId,
          },
        },
      });
    }
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
    if (subjectAreaIds.length > 0) {
      conditions.push({
        subjectAreas: {
          some: {
            subjectAreaId: {
              in: subjectAreaIds,
            },
          },
        },
      });
    }
    const radiusKm = normalizeRadiusKm(filters.radiusKm);
    let nearbyInstitutionIds: number[] | null = null;
    if (filters.municipality && radiusKm) {
      nearbyInstitutionIds = await findInstitutionIdsWithinRadius(this.prisma, {
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
// SPEC-008: multiple territorial preferences, independent of the
// single-territory filters already used by SPEC-004.
    if (filters.territorialIds !== undefined) {
      const matchingInstitutionIds = await findInstitutionIdsMatchingTerritories(
        this.prisma,
        filters.territorialIds,
      );
// An empty result must return zero processes; never ignore this filter.
      conditions.push({
        institutionId: {
          in: matchingInstitutionIds,
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
        getCataloniaCalendarDate(),
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
    return { where, textMatches };
  }

/**
   * SPEC-008 - "Para mi": priority is based on application dates,
   * not on the official CIDO status.
   *
   * 1. Application period currently open: earliest end date first.
   * 2. Application period not yet started: earliest start date first.
   * 3. Unknown application period: most recently published first.
   * 4. Application period already closed: most recent end date first.
   *
   * Each group is ordered and paginated in PostgreSQL. The statusId
   * and all other selection filters remain part of the supplied `where`.
   */
  private async findDeadlinePriorityPage(
    page: number,
    pageSize: number,
    skip: number,
    where: Prisma.SelectionProcessWhereInput,
  ): Promise<SelectionProcessPage> {
    const today = getCataloniaCalendarDate();
    const openWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, buildApplicationPeriodWhereInput("open", today)],
    };
    const futureWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, buildApplicationPeriodWhereInput("future", today)],
    };
    const unknownWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, buildApplicationPeriodWhereInput("unknown", today)],
    };
    const closedWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, buildApplicationPeriodWhereInput("closed", today)],
    };
    const [totalItems, openCount, futureCount, closedCount] = await Promise.all([
      this.prisma.selectionProcess.count({ where }),
      this.prisma.selectionProcess.count({ where: openWhere }),
      this.prisma.selectionProcess.count({ where: futureWhere }),
      this.prisma.selectionProcess.count({ where: closedWhere }),
    ]);
// The four date-based groups are mutually exclusive and exhaustive.
    const unknownCount = Math.max(
      0,
      totalItems - openCount - futureCount - closedCount,
    );
    return this.findGroupedPage(page, pageSize, skip, totalItems, [
      {
        where: openWhere,
        count: openCount,
        orderBy: [
          { applicationEndDate: { sort: "asc", nulls: "last" } },
          { id: "asc" },
        ],
      },
      {
        where: futureWhere,
        count: futureCount,
        orderBy: [
          { applicationStartDate: { sort: "asc", nulls: "last" } },
          { id: "asc" },
        ],
      },
      {
        where: unknownWhere,
        count: unknownCount,
        orderBy: [
          { lastDocumentPublicationDate: { sort: "desc", nulls: "last" } },
          { id: "asc" },
        ],
      },
      {
        where: closedWhere,
        count: closedCount,
        orderBy: [
          { applicationEndDate: { sort: "desc", nulls: "last" } },
          { id: "asc" },
        ],
      },
    ]);
  }
  /**
   * Plazo: finaliza antes.
   *
   * 1. Plazo pendiente (fin hoy o después): el que termina antes, primero.
   * 2. Sin fecha de fin.
   * 3. Plazo finalizado: el cerrado más recientemente, primero.
   */
  private async findDeadlineAscPage(
    page: number,
    pageSize: number,
    skip: number,
    where: Prisma.SelectionProcessWhereInput,
  ): Promise<SelectionProcessPage> {
    const today = getCataloniaCalendarDate();
    const pendingWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, { applicationEndDate: { gte: today } }],
    };
    const unknownWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, { applicationEndDate: null }],
    };
    const closedWhere: Prisma.SelectionProcessWhereInput = {
      AND: [where, buildApplicationPeriodWhereInput("closed", today)],
    };
    const [totalItems, pendingCount, closedCount] = await Promise.all([
      this.prisma.selectionProcess.count({ where }),
      this.prisma.selectionProcess.count({ where: pendingWhere }),
      this.prisma.selectionProcess.count({ where: closedWhere }),
    ]);
    // Los tres grupos son excluyentes y cubren todas las convocatorias.
    const unknownCount = Math.max(0, totalItems - pendingCount - closedCount);
    return this.findGroupedPage(page, pageSize, skip, totalItems, [
      {
        where: pendingWhere,
        count: pendingCount,
        orderBy: [{ applicationEndDate: "asc" }, { id: "asc" }],
      },
      {
        where: unknownWhere,
        count: unknownCount,
        orderBy: [{ id: "asc" }],
      },
      {
        where: closedWhere,
        count: closedCount,
        orderBy: [{ applicationEndDate: "desc" }, { id: "asc" }],
      },
    ]);
  }
  /** Pagina varios grupos excluyentes como si fueran una sola lista ordenada. */
  private async findGroupedPage(
    page: number,
    pageSize: number,
    skip: number,
    totalItems: number,
    groups: OrderedGroup[],
  ): Promise<SelectionProcessPage> {
    const rows: SelectionProcessRow[] = [];
    let remainingSkip = skip;
    let remainingTake = pageSize;
    for (const group of groups) {
      if (remainingTake <= 0) {
        break;
      }
      if (remainingSkip >= group.count) {
        remainingSkip -= group.count;
        continue;
      }
      const take = Math.min(remainingTake, group.count - remainingSkip);
      const groupRows = await this.prisma.selectionProcess.findMany({
        where: group.where,
        include: { institution: true },
        orderBy: group.orderBy,
        skip: remainingSkip,
        take,
      });
      rows.push(...groupRows);
      remainingTake -= groupRows.length;
      remainingSkip = 0;
    }
    return {
      items: rows.map((row) => mapSelectionProcessListItem(row)),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }
  /** Opciones de los filtros del buscador (ver prisma-selection-process-filter-options.ts). */
  async getFilterOptions(): Promise<SelectionProcessFilterOptions> {
    return getSelectionProcessFilterOptions(this.prisma);
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
