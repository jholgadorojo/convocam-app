import type { SelectionProcessMunicipalityMapPoint } from "./selection-process-municipality-map-point";
import type { SelectionProcessMunicipalityMapQueryRepository } from "./selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

/**
 * SPEC-010.7 — Consulta territorial del buscador público.
 *
 * Devuelve los municipios de TODAS las convocatorias que cumplen los filtros
 * del buscador, sin aplicar la paginación de las tarjetas.
 *
 * La búsqueda normal y el mapa comparten la misma implementación de filtros
 * en el repositorio, evitando diferencias en sus resultados.
 */
export class ListSelectionProcessMunicipalityMapPoints {
  constructor(
    private readonly municipalityMapQueryRepository:
      SelectionProcessMunicipalityMapQueryRepository,
  ) {}

  async execute(
    filters: SelectionProcessSearchFilters,
  ): Promise<SelectionProcessMunicipalityMapPoint[]> {
    return this.municipalityMapQueryRepository.listMunicipalityMapPoints(
      filters,
    );
  }
}
