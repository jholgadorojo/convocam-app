import { ListActiveSelectionProcesses } from "./list-active-selection-processes";

import type { SelectionProcessMunicipalityMapPoint } from "./selection-process-municipality-map-point";
import type { SelectionProcessMunicipalityMapQueryRepository } from "./selection-process-query-repository";
import type { SelectionProcessPage } from "./selection-process-page";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

/**
 * Preferencias territoriales de SPEC-007.
 */
type TerritorialPreferences = {
  scope: "ALL_CATALONIA" | "SELECTED_TERRITORIES";
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};

/**
 * Preferencias profesionales de SPEC-007.
 */
type ProfessionalPreferences = {
  selectionProcessType:
    | "POSITIONS"
    | "JOB_POOLS"
    | "BOTH"
    | null;

  subjectAreaIds: number[];
  qualificationGroups: string[];
};

/**
 * Contrato de lectura de preferencias.
 */
type PreferencesReader<T> = {
  execute(
    input: { userId: string },
  ): Promise<T | null>;
};

export type ListSelectionProcessesForMeInput = {
  userId: string;
  page?: number;

  /**
   * SPEC-009 - Dashboard.
   * Permite solicitar un numero diferente de resultados por pagina.
   * SPEC-008 mantiene 10 por defecto.
   */
  pageSize?: number;

  /**
   * SPEC-009 - Dashboard.
   * Cuando es true, excluye las convocatorias que el usuario ya sigue.
   * SPEC-008 mantiene false por defecto.
   */
  excludeFollowed?: boolean;

  /**
   * SPEC-010 - Mapa de "Para mi".
   * Filtra las tarjetas por municipio y, opcionalmente, provincia.
   * No limita los marcadores del mapa: el usuario puede cambiar de municipio.
   */
  municipality?: string;
  province?: string;

  /**
   * SPEC-010 - Mapa de "Para mi".
   * Devuelve los municipios de TODAS las coincidencias, sin paginacion.
   * El valor por defecto es false para mantener las llamadas existentes.
   */
  includeMunicipalityMapPoints?: boolean;
};

export type ListSelectionProcessesForMeResult =
  | {
      kind: "preferences-not-configured";
    }
  | {
      kind: "results";
      page: SelectionProcessPage;
      /** Solo se incluye cuando se solicita expresamente. */
      municipalityMapPoints?: SelectionProcessMunicipalityMapPoint[];
    };

export class ListSelectionProcessesForMe {
  constructor(
    private readonly territorialPreferencesReader:
      PreferencesReader<TerritorialPreferences>,

    private readonly professionalPreferencesReader:
      PreferencesReader<ProfessionalPreferences>,

    private readonly listActiveSelectionProcesses:
      ListActiveSelectionProcesses,

    /**
     * Dependencia opcional temporalmente para no romper las llamadas y
     * pruebas anteriores. Se conectara en el Composition Root en el paso
     * siguiente, antes de que "Para mi" solicite los puntos del mapa.
     */
    private readonly municipalityMapQueryRepository?:
      SelectionProcessMunicipalityMapQueryRepository,
  ) {}

  async execute(
    input: ListSelectionProcessesForMeInput,
  ): Promise<ListSelectionProcessesForMeResult> {
    const userId = input.userId.trim();

    const page = input.page ?? 1;

    const pageSize = input.pageSize ?? 10;

    if (!userId) {
      throw new Error("userId is required");
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new Error(
        "page must be an integer greater than or equal to 1",
      );
    }

    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      throw new Error(
        "pageSize must be an integer between 1 and 100",
      );
    }

    // Recuperar preferencias del opositor.
    const [
      territorialPreferences,
      professionalPreferences,
    ] = await Promise.all([
      this.territorialPreferencesReader.execute({ userId }),
      this.professionalPreferencesReader.execute({ userId }),
    ]);

    // Comprobar si existen preferencias configuradas.
    const hasTerritorialPreferences =
      territorialPreferences !== null;

    const hasProfessionalPreferences =
      professionalPreferences !== null &&
      (
        professionalPreferences.selectionProcessType !== null ||
        professionalPreferences.subjectAreaIds.length > 0 ||
        professionalPreferences.qualificationGroups.length > 0
      );

    if (
      !hasTerritorialPreferences &&
      !hasProfessionalPreferences
    ) {
      return {
        kind: "preferences-not-configured",
      };
    }

    // Filtros comunes de "Para mi": mismos criterios para tarjetas y mapa.
    const baseFilters: SelectionProcessSearchFilters = {
      statusId: [2, 3],
      sort: "deadline-priority",
    };

    // Preferencias territoriales.
    if (
      territorialPreferences?.scope ===
      "SELECTED_TERRITORIES"
    ) {
      baseFilters.territorialIds = {
        provinceIds: territorialPreferences.provinceIds,
        countyIds: territorialPreferences.countyIds,
        municipalityIds: territorialPreferences.municipalityIds,
      };
    }

    // Preferencias profesionales.
    if (professionalPreferences) {
      const processType =
        professionalPreferences.selectionProcessType;

      if (processType === "POSITIONS") {
        baseFilters.isJobPool = false;
      } else if (processType === "JOB_POOLS") {
        baseFilters.isJobPool = true;
      }

      // BOTH o null: sin restriccion por tipo.
      if (professionalPreferences.subjectAreaIds.length > 0) {
        baseFilters.subjectAreaIds =
          professionalPreferences.subjectAreaIds;
      }

      if (professionalPreferences.qualificationGroups.length > 0) {
        baseFilters.qualificationGroup =
          professionalPreferences.qualificationGroups;
      }
    }

    // SPEC-009: exclusion voluntaria, aplicada antes de contar y paginar.
    if (input.excludeFollowed === true) {
      baseFilters.excludeFollowedByUserId = userId;
    }

    // SPEC-010: solo las tarjetas usan el filtro del municipio seleccionado.
    // El mapa recibe baseFilters sin este filtro y mantiene todos los puntos.
    const filters: SelectionProcessSearchFilters = { ...baseFilters };
    const selectedMunicipality = input.municipality?.trim();
    if (selectedMunicipality) {
      filters.municipality = selectedMunicipality;
      const selectedProvince = input.province?.trim();
      if (selectedProvince) {
        filters.province = selectedProvince;
      }
    }

    // La consulta del mapa solo se activa cuando "Para mi" la solicita.
    // Asi no cambia el comportamiento de SPEC-008, SPEC-009 ni sus tests.
    let mapPointsPromise: Promise<SelectionProcessMunicipalityMapPoint[]> | null =
      null;
    if (input.includeMunicipalityMapPoints === true) {
      if (!this.municipalityMapQueryRepository) {
        throw new Error(
          "municipalityMapQueryRepository is required to load map points",
        );
      }
      mapPointsPromise =
        this.municipalityMapQueryRepository.listMunicipalityMapPoints(
          baseFilters,
        );
    }

    // Consultar simultaneamente tarjetas paginadas y puntos de todos los
    // municipios. No descargamos todos los procesos para dibujar el mapa.
    const [initialResults, municipalityMapPoints] = await Promise.all([
      this.listActiveSelectionProcesses.execute({
        page,
        pageSize,
        filters,
      }),
      mapPointsPromise ?? Promise.resolve(null),
    ]);

    let results = initialResults;

    // Ajustar una pagina superior a la ultima disponible.
    if (
      results.totalPages > 0 &&
      page > results.totalPages
    ) {
      results =
        await this.listActiveSelectionProcesses.execute({
          page: results.totalPages,
          pageSize,
          filters,
        });
    }

    // No incluir la nueva propiedad en los resultados de las llamadas
    // existentes: sus contratos y pruebas mantienen el mismo resultado.
    if (municipalityMapPoints !== null) {
      return {
        kind: "results",
        page: results,
        municipalityMapPoints,
      };
    }

    return {
      kind: "results",
      page: results,
    };
  }
}
