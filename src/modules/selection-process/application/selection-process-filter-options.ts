export type SelectionProcessFilterOption = {
  id: number;
  name: string;
};

export type SelectionProcessFilterOptions = {
  municipalities: string[];
  counties: string[];
  provinces: string[];

  statuses: SelectionProcessFilterOption[];
  scopes: SelectionProcessFilterOption[];
  selectionSystems: SelectionProcessFilterOption[];
  personnelTypes: SelectionProcessFilterOption[];

  qualificationGroups: string[];
};