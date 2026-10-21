import type { SelectionProcessFilterOptions } from "./selection-process-filter-options";
import type { SelectionProcessMunicipalityMapPoint } from "./selection-process-municipality-map-point";
import type { SelectionProcessPage } from "./selection-process-page";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

/**
 * Contrato general de busqueda y listado de convocatorias.
 * Se mantiene compatible con SPEC-004, SPEC-008, SPEC-009 y sus pruebas.
 */
export interface SelectionProcessQueryRepository {
  findActive(
    page: number,
    pageSize: number,
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessPage>;

  getFilterOptions(): Promise<SelectionProcessFilterOptions>;
}

/**
 * Contrato especifico para el mapa de convocatorias recomendadas.
 * Un repositorio que solo lista convocatorias no necesita implementarlo.
 */
export interface SelectionProcessMunicipalityMapQueryRepository {
  listMunicipalityMapPoints(
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessMunicipalityMapPoint[]>;
}
