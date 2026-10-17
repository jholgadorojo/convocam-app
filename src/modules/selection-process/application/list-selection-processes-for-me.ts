
import { ListActiveSelectionProcesses } from "./list-active-selection-processes";

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
};

export type ListSelectionProcessesForMeResult =
  | {
      kind: "preferences-not-configured";
    }
  | {
      kind: "results";
      page: SelectionProcessPage;
    };

export class ListSelectionProcessesForMe {
  constructor(
    private readonly territorialPreferencesReader:
      PreferencesReader<TerritorialPreferences>,

    private readonly professionalPreferencesReader:
      PreferencesReader<ProfessionalPreferences>,

    private readonly listActiveSelectionProcesses:
      ListActiveSelectionProcesses,
  ) {}

  async execute(
    input: ListSelectionProcessesForMeInput,
  ): Promise<ListSelectionProcessesForMeResult> {
    const userId = input.userId.trim();
    const page = input.page ?? 1;

    if (!userId) {
      throw new Error("userId is required");
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new Error(
        "page must be an integer greater than or equal to 1",
      );
    }

    // Recuperar preferencias del opositor.
    const [
      territorialPreferences,
      professionalPreferences,
    ] = await Promise.all([
      this.territorialPreferencesReader.execute({
        userId,
      }),
      this.professionalPreferencesReader.execute({
        userId,
      }),
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

    // Filtros comunes de «Para mí».
    const filters: SelectionProcessSearchFilters = {
      statusId: [2, 3],
      sort: "deadline-priority",
    };

    // Preferencias territoriales.
    if (
      territorialPreferences?.scope ===
      "SELECTED_TERRITORIES"
    ) {
      filters.territorialIds = {
        provinceIds:
          territorialPreferences.provinceIds,
        countyIds:
          territorialPreferences.countyIds,
        municipalityIds:
          territorialPreferences.municipalityIds,
      };
    }

    // Preferencias profesionales.
    if (professionalPreferences) {
      const processType =
        professionalPreferences.selectionProcessType;

      if (processType === "POSITIONS") {
        filters.isJobPool = false;
      } else if (processType === "JOB_POOLS") {
        filters.isJobPool = true;
      }

      // BOTH o null: sin restricción por tipo.

      if (
        professionalPreferences.subjectAreaIds.length > 0
      ) {
        filters.subjectAreaIds =
          professionalPreferences.subjectAreaIds;
      }

      if (
        professionalPreferences.qualificationGroups.length > 0
      ) {
        filters.qualificationGroup =
          professionalPreferences.qualificationGroups;
      }
    }

    // Buscar las convocatorias coincidentes.
    let results =
      await this.listActiveSelectionProcesses.execute({
        page,
        pageSize: 10,
        filters,
      });

    // Ajustar una página superior a la última disponible.
    if (
      results.totalPages > 0 &&
      page > results.totalPages
    ) {
      results =
        await this.listActiveSelectionProcesses.execute({
          page: results.totalPages,
          pageSize: 10,
          filters,
        });
    }

    return {
      kind: "results",
      page: results,
    };
  }
}
