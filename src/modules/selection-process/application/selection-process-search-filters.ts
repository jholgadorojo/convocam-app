export type SelectionProcessSearchFilters = {
  text?: string;

  municipality?: string;
  county?: string;
  province?: string;

  statusId?: number;
  scopeId?: number;
  selectionSystemId?: number;
  personnelTypeId?: number;

  qualificationGroup?: string;
  isJobPool?: boolean;

  applicationEndDateFrom?: Date;
  applicationEndDateTo?: Date;

  reservedDisability?: boolean;
  reservedUnemployed?: boolean;
  reservedYoung?: boolean;
  reservedWomen?: boolean;
};