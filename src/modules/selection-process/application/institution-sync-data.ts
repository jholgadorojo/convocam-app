export type InstitutionSyncData = {
  cidoId: string;

  name: string;
  shortName: string;
  isActive: boolean;

  latitude: number | null;
  longitude: number | null;

  ineCode: string | null;
  address: string | null;
  postalCode: string | null;

  municipality: string | null;

  countyCode: string | null;
  county: string | null;

  provinceCode: string | null;
  province: string | null;

  contractorProfileUrl: string | null;

  socCode: string | null;
  sepeCode: string | null;
};