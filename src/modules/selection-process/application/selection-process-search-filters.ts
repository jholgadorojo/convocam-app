export type SelectionProcessSort =
  | "relevance"
  | "publication-desc"
  | "deadline-asc"
  | "deadline-desc"
  | "municipality-asc";

export type SelectionProcessApplicationPeriodFilter =
  | "open"
  | "future"
  | "closed"
  | "unknown";

export type SelectionProcessSearchFilters = {
  text?: string;

  qualificationGroup?:
    | string
    | string[];

  isJobPool?: boolean;

  statusId?: number;

  province?: string;
  county?: string;
  municipality?: string;

  /*
   * Radio aproximado, en kilómetros,
   * tomando como origen el municipio
   * seleccionado.
   */
  radiusKm?: number;

  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;

  /*
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

  /*
   * Ordenación de los resultados.
   */
  sort?: SelectionProcessSort;
};