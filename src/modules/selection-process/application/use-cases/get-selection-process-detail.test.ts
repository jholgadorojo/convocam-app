import { describe, expect, it } from "vitest";

import type { SelectionProcessDetailDto } from "../dto/selection-process-detail.dto";
import type { SelectionProcessDetailRepository } from "../repositories/selection-process-detail.repository";
import { GetSelectionProcessDetail } from "./get-selection-process-detail";

class FakeSelectionProcessDetailRepository
  implements SelectionProcessDetailRepository
{
  constructor(
    private readonly selectionProcess:
      SelectionProcessDetailDto | null,
  ) {}

  async findById(
    id: number,
  ): Promise<SelectionProcessDetailDto | null> {
    if (!this.selectionProcess) {
      return null;
    }

    if (this.selectionProcess.id !== id) {
      return null;
    }

    return this.selectionProcess;
  }
}

const selectionProcessDetail: SelectionProcessDetailDto = {
  id: 123,

  cidoIdentifier: "CIDO-123",
  fileNumber: "EXP-2026-001",
  publicOfferYear: 2026,

  title: "Técnico/a de administración general",
  isJobPool: false,

  status: "Plazo abierto",
  scope: "Catalunya",

  applicationStartDate: new Date("2026-10-01"),
  applicationEndDate: new Date("2026-10-20"),
  applicationEndTime: "23:59",
  applicationDeadlineNotes: null,

  selectionSystem: "Concurso oposición",
  personnelType: "Funcionario",

  qualificationGroup: "A1",
  requiredQualification: "Grado universitario",
  otherRequirements: null,

  numberOfPositions: 2,

  firstExamDate: null,
  observations: null,

  applicationUrl: "https://example.com/solicitud",
  institutionUrl: "https://example.com/institucion",
  cidoUrl: "https://example.com/cido",

  lastDocumentPublicationDate: new Date("2026-10-02"),

  reservedPlaces: {
    disability: 1,
    unemployed: false,
    youngPeople: false,
    women: false,
  },

  institution: {
    id: 10,
    name: "Ajuntament de Cardedeu",
    shortName: "Cardedeu",
    address: "Plaça de Sant Joan, 1",
    postalCode: "08440",
    municipality: "Cardedeu",
    county: "Vallès Oriental",
    province: "Barcelona",
    latitude: 41.6398,
    longitude: 2.3574,
  },

  subjectAreas: [
    {
      id: 1,
      name: "Administración general",
    },
  ],

  documents: [
    {
      id: 100,
      publicationDate: new Date("2026-10-02"),
      summary: "Bases específicas",
      publisher: "BOPB",
      bulletin: "Butlletí Oficial de la Província de Barcelona",
      bulletinNumber: null,
      phase: "Bases",
      phaseNotes: null,
      documentUrl: "https://example.com/documento.pdf",
      htmlUrl: null,
    },
  ],
};

describe("GetSelectionProcessDetail", () => {
  it("returns the selection process detail when it exists", async () => {
    const repository =
      new FakeSelectionProcessDetailRepository(
        selectionProcessDetail,
      );

    const useCase =
      new GetSelectionProcessDetail(repository);

    const result = await useCase.execute({
      id: 123,
    });

    expect(result).toEqual(selectionProcessDetail);
  });

  it("returns null when the selection process does not exist", async () => {
    const repository =
      new FakeSelectionProcessDetailRepository(null);

    const useCase =
      new GetSelectionProcessDetail(repository);

    const result = await useCase.execute({
      id: 999,
    });

    expect(result).toBeNull();
  });

  it("returns null when the requested id does not match", async () => {
    const repository =
      new FakeSelectionProcessDetailRepository(
        selectionProcessDetail,
      );

    const useCase =
      new GetSelectionProcessDetail(repository);

    const result = await useCase.execute({
      id: 999,
    });

    expect(result).toBeNull();
  });
});