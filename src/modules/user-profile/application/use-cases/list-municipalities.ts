import {
  MunicipalityListItem,
  MunicipalityQueryRepository,
} from "../repositories/municipality-query.repository";

export class ListMunicipalities {
  constructor(
    private readonly municipalityQueryRepository: MunicipalityQueryRepository,
  ) {}

  async execute(): Promise<MunicipalityListItem[]> {
    return this.municipalityQueryRepository.listAll();
  }
}