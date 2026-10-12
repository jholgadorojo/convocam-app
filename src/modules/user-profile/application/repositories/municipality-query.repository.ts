export type MunicipalityListItem = {
  id: number;
  code: string;
  name: string;
  countyName: string;
  provinceName: string;
};

export interface MunicipalityQueryRepository {
  existsById(municipalityId: number): Promise<boolean>;

  listAll(): Promise<MunicipalityListItem[]>;
}