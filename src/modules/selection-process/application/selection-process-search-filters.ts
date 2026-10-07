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
   *
   * Solo se aplicará cuando también
   * exista municipality.
   */
  radiusKm?: number;

  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;

  applicationEndDateFrom?: Date;
  applicationEndDateTo?: Date;

  reservedDisability?: boolean;
  reservedUnemployed?: boolean;
  reservedYoung?: boolean;
  reservedWomen?: boolean;
};