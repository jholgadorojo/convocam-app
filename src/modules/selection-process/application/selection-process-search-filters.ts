
export type SelectionProcessSort =
  | "relevance"
  | "publication-desc"
  | "deadline-asc"
  | "deadline-desc"
  | "municipality-asc"
  | "deadline-priority";

/**
 * Ordenación efectiva: sin indicar, por relevancia si hay texto y
 * por plazo si no; la relevancia sin texto no tiene sentido y
 * también pasa a ordenar por plazo.
 */
export function resolveSelectionProcessSort(
  sort: SelectionProcessSort | undefined,
  hasTextSearch: boolean,
): SelectionProcessSort {
  if (sort === undefined) {
    return hasTextSearch ? "relevance" : "deadline-asc";
  }
  if (sort === "relevance" && !hasTextSearch) {
    return "deadline-asc";
  }
  return sort;
}

export type SelectionProcessApplicationPeriodFilter =
  | "open"
  | "future"
  | "closed"
  | "unknown";

/**
 * Selección de territorios mediante sus identificadores
 * internos del catálogo territorial.
 *
 * Se utilizará en SPEC-008 — Para mí.
 *
 * Las coincidencias entre provincias, comarcas y municipios
 * se combinarán mediante OR.
 */
export type SelectionProcessTerritorialIds = {
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};

export type SelectionProcessSearchFilters = {
  text?: string;

  qualificationGroup?:
    | string
    | string[];

  isJobPool?: boolean;

  statusId?: number | number[];

  province?: string;
  county?: string;
  municipality?: string;

  /**
   * Selección múltiple de territorios.
   *
   * Nueva funcionalidad SPEC-008.
   * No sustituye los filtros territoriales existentes
   * del buscador general.
   */
  territorialIds?: SelectionProcessTerritorialIds;

  /**
   * Materias profesionales CIDO.
   *
   * Una convocatoria coincidirá si está relacionada
   * con al menos una de las materias indicadas.
   */
  subjectAreaIds?: number[];

  /**
   * Radio aproximado, en kilómetros,
   * tomando como origen el municipio
   * seleccionado.
   */
  radiusKm?: number;

  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;

  /**
   * Estado calculado del plazo de solicitud.
   *
   * No procede del estado oficial de CIDO.
   *
   * open
   *   El plazo está abierto actualmente.
   *
   * future
   *   El plazo todavía no ha comenzado.
   *
   * closed
   *   El plazo ya ha finalizado.
   *
   * unknown
   *   No tenemos fechas suficientes
   *   para determinar el estado.
   */
  applicationPeriod?:
    SelectionProcessApplicationPeriodFilter;

  applicationEndDateFrom?: Date;
  applicationEndDateTo?: Date;

  reservedDisability?: boolean;
  reservedUnemployed?: boolean;
  reservedYoung?: boolean;
  reservedWomen?: boolean;

  /**
   * Ordenación de los resultados.
   *
   * deadline-priority:
   *   Ordenación específica de SPEC-008 — Para mí.
   */
  sort?: SelectionProcessSort;

  /**
   * SPEC-009 — Dashboard del opositor.
   *
   * Excluye de los resultados las convocatorias
   * que ya sigue el usuario indicado.
   *
   * La exclusión se aplicará en PostgreSQL
   * antes de calcular el total de resultados
   * y antes de aplicar la paginación.
   *
   * Si no se indica este filtro,
   * las búsquedas mantienen su comportamiento actual.
   *
   * El identificador debe proceder del usuario
   * autenticado, nunca de un parámetro público.
   */
  excludeFollowedByUserId?: string;
};
