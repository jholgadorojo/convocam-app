export interface MunicipalityQueryRepository {
  existsById(municipalityId: number): Promise<boolean>;
}