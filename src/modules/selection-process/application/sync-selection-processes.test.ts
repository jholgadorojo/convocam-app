import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { InstitutionRepository } from "./institution-repository";
import type { InstitutionSource } from "./institution-source";
import type { InstitutionSyncData } from "./institution-sync-data";
import type { SelectionProcessDocumentRepository } from "./selection-process-document-repository";
import type { SelectionProcessDocumentSource } from "./selection-process-document-source";
import type { SelectionProcessDocumentSyncData } from "./selection-process-document-sync-data";
import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";
import type { SelectionProcessSubjectAreaRepository } from "./selection-process-subject-area-repository";
import type { SelectionProcessSyncData } from "./selection-process-sync-data";
import type { SubjectAreaRepository } from "./subject-area-repository";
import type { SubjectAreaSource } from "./subject-area-source";
import type { SubjectAreaSyncData } from "./subject-area-sync-data";

import { SyncSelectionProcesses } from "./sync-selection-processes";

const SELECTION_PROCESS_ID = 1;
const INSTITUTION_ID = 10;

const selectionProcess: SelectionProcessSyncData = {
  cidoId: "100",
  cidoIdentifier: "CIDO-100",
  fileNumber: null,
  publicOfferYear: 2026,

  title: "1 plaça de tècnic d'informàtica",
  isJobPool: false,
  scopeId: 1,
  scopeName: "Local",
  institutionName: "Ajuntament de Prova",

  applicationStartDate: null,
  applicationEndDate: null,
  applicationEndTime: null,
  applicationDeadlineNotes: null,

  selectionSystemId: null,
  selectionSystem: null,

  personnelTypeId: null,
  personnelType: null,

  qualificationGroupId: null,
  qualificationGroup: null,

  requiredQualification: null,
  otherRequirements: null,

  numberOfPositions: 1,

  reservedDisabilityPositions: null,
  reservedUnemployed: false,
  reservedYoung: false,
  reservedWomen: false,

  firstExamDate: null,
  observations: null,

  institutionUrl: null,
  applicationUrl: null,
  cidoUrl: "https://cido.diba.cat/oposicions/100",

  statusId: 3,
  status: "Termini obert",

  lastDocumentPublicationDate: null,
};

const institution: InstitutionSyncData = {
  cidoId: "200",

  name: "Ajuntament de Prova",
  shortName: "Prova",
  isActive: true,

  latitude: null,
  longitude: null,

  ineCode: null,
  address: null,
  postalCode: null,

  municipality: null,

  countyCode: null,
  county: null,

  provinceCode: null,
  province: null,

  contractorProfileUrl: null,

  socCode: null,
  sepeCode: null,
};

const subjectAreas: SubjectAreaSyncData[] = [
  {
    cidoId: "300",
    name: "Informàtica",
    cidoModuleId: 1,
  },
  {
    cidoId: "301",
    name: "Administració pública",
    cidoModuleId: 1,
  },
];

function buildDocument(
  cidoId: string,
): SelectionProcessDocumentSyncData {
  return {
    cidoId,

    publicationDate: new Date("2026-10-01T00:00:00.000Z"),
    summary: `Document ${cidoId}`,
    publisher: null,

    bulletinId: 1,
    bulletin: "BOPB",
    bulletinNumber: null,

    entryDate: new Date("2026-10-01T00:00:00.000Z"),

    phaseId: 1,
    phase: "Bases",
    phaseNotes: null,

    documentUrl: `https://example.com/${cidoId}.pdf`,
    htmlUrl: null,
  };
}

function buildUseCase({
  documents,
}: {
  documents: SelectionProcessDocumentSyncData[];
}) {
  const source = {
    getPage: vi.fn(async () => ({
      total: 1,
      items: [selectionProcess],
    })),

    getByCidoId: vi.fn(async () => null),
  } satisfies SelectionProcessSource;

  const repository = {
    upsert: vi.fn(async () => SELECTION_PROCESS_ID),

    findActiveNotSeenSince: vi.fn(async () => []),

    markSourceInactive: vi.fn(async () => {}),
  } satisfies SelectionProcessRepository;

  const institutionSource = {
    getBySelectionProcessCidoId:
      vi.fn(async () => institution),
  } satisfies InstitutionSource;

  const institutionRepository = {
    upsert: vi.fn(async () => INSTITUTION_ID),
  } satisfies InstitutionRepository;

  const subjectAreaSource = {
    getBySelectionProcessCidoId:
      vi.fn(async () => subjectAreas),
  } satisfies SubjectAreaSource;

  const subjectAreaRepository = {
    upsert: vi.fn(
      async (data: SubjectAreaSyncData) =>
        Number(data.cidoId),
    ),
  } satisfies SubjectAreaRepository;

  const selectionProcessSubjectAreaRepository = {
    replaceAll: vi.fn(async () => {}),
  } satisfies SelectionProcessSubjectAreaRepository;

  const documentSource = {
    getBySelectionProcessCidoId:
      vi.fn(async () => documents),
  } satisfies SelectionProcessDocumentSource;

  const documentRepository = {
    upsert: vi.fn(async () => 1),

    markMissingAsInactive: vi.fn(async () => {}),
  } satisfies SelectionProcessDocumentRepository;

  const useCase = new SyncSelectionProcesses(
    source,
    repository,
    institutionSource,
    institutionRepository,
    subjectAreaSource,
    subjectAreaRepository,
    selectionProcessSubjectAreaRepository,
    documentSource,
    documentRepository,
  );

  return {
    useCase,
    repository,
    institutionRepository,
    selectionProcessSubjectAreaRepository,
    documentRepository,
  };
}

describe("SyncSelectionProcesses", () => {
  it("marca como inactivos los documentos de una convocatoria que ya no tiene documentos en CIDO", async () => {
    const {
      useCase,
      documentRepository,
    } = buildUseCase({
      documents: [],
    });

    await useCase.execute({
      limit: 10,
      offset: 0,
    });

    expect(
      documentRepository.upsert,
    ).not.toHaveBeenCalled();

    expect(
      documentRepository.markMissingAsInactive,
    ).toHaveBeenCalledTimes(1);

    expect(
      documentRepository.markMissingAsInactive,
    ).toHaveBeenCalledWith(
      SELECTION_PROCESS_ID,
      [],
    );
  });

  it("desactiva una sola vez los documentos que faltan, con los cidoId actuales", async () => {
    const {
      useCase,
      documentRepository,
    } = buildUseCase({
      documents: [
        buildDocument("400"),
        buildDocument("401"),
      ],
    });

    await useCase.execute({
      limit: 10,
      offset: 0,
    });

    expect(
      documentRepository.upsert,
    ).toHaveBeenCalledTimes(2);

    expect(
      documentRepository.markMissingAsInactive,
    ).toHaveBeenCalledTimes(1);

    expect(
      documentRepository.markMissingAsInactive,
    ).toHaveBeenCalledWith(
      SELECTION_PROCESS_ID,
      ["400", "401"],
    );
  });

  it("sincroniza institución, convocatoria, materias y documentos y devuelve los contadores", async () => {
    const {
      useCase,
      repository,
      institutionRepository,
      selectionProcessSubjectAreaRepository,
      documentRepository,
    } = buildUseCase({
      documents: [
        buildDocument("400"),
      ],
    });

    const result = await useCase.execute({
      limit: 10,
      offset: 0,
    });

    expect(
      institutionRepository.upsert,
    ).toHaveBeenCalledWith(institution);

    expect(
      repository.upsert,
    ).toHaveBeenCalledWith(
      selectionProcess,
      INSTITUTION_ID,
    );

    expect(
      selectionProcessSubjectAreaRepository.replaceAll,
    ).toHaveBeenCalledWith(
      SELECTION_PROCESS_ID,
      [300, 301],
    );

    expect(
      documentRepository.upsert,
    ).toHaveBeenCalledWith(
      buildDocument("400"),
      SELECTION_PROCESS_ID,
    );

    expect(result).toEqual({
      totalAvailable: 1,
      processed: 1,
      institutionsProcessed: 1,
      subjectAreasProcessed: 2,
      documentsProcessed: 1,
    });
  });
});
