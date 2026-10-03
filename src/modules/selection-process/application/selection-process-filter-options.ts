export type SelectionProcessFilterOption = {
  id: number;
  name: string;
};

export type SelectionProcessTerritoryOption = {
  province: string;
  county: string | null;
  municipality: string | null;
};

export type SelectionProcessFilterOptions = {
  municipalities: string[];
  counties: string[];
  provinces: string[];

  territories: SelectionProcessTerritoryOption[];

  statuses: SelectionProcessFilterOption[];
  scopes: SelectionProcessFilterOption[];
  selectionSystems: SelectionProcessFilterOption[];
  personnelTypes: SelectionProcessFilterOption[];

  qualificationGroups: string[];
};