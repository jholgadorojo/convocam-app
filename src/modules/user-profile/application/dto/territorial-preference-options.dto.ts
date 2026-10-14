
export type TerritorialPreferenceOptionDto = {
  id: number;
  name: string;
};

export type MunicipalityPreferenceOptionDto =
  TerritorialPreferenceOptionDto & {
    countyId: number;
    provinceId: number;
  };

export type TerritorialPreferenceOptionsDto = {
  provinces: TerritorialPreferenceOptionDto[];
  counties: TerritorialPreferenceOptionDto[];
  municipalities: MunicipalityPreferenceOptionDto[];
};
