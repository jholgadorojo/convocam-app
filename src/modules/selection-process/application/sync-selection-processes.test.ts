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
import type {
  SelectionProcessSource,
  SelectionProcessSourceRejection,
} from "./selection-process-source";
import type { SelectionProcessSubjectAreaRepository } from "./selection-process-subject-area-repository";
import type { SelectionProcessSyncData } from "./selection-process-sync-data";
import type { SubjectAreaRepository } from "./subject-area-repository";
import type { SubjectAreaSource } from "./subject-area-source";
import type { SubjectAreaSyncData } from "./subject-area-sync-data";

import { SyncSelectionProcesses } from "./sync-selection-processes";

// El doble del repositorio devuelve el cidoId
// numérico como id interno de la convocatoria.
const SELECTION_PROCESS_ID = 100;
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

const secondSelectionProcess: SelectionProcessSyncData = {
  ...selectionProcess,
  cidoId: "101",
  cidoIdentifier: "CIDO-101",
  cidoUrl: "https://cido.diba.cat/oposicions/101",
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
  selectionProcesses = [selectionProcess],
  rejected = [],
  failingDocumentsCidoId,
}: {
  documents: SelectionProcessDocumentSyncData[];
  selectionProcesses?: SelectionProcessSyncData[];
  rejected?: SelectionProcessSourceRejection[];
  failingDocumentsCidoId?: string;
}) {
  const source = {
    getPage: vi.fn(async () => ({
      total: selectionProcesses.length + rejected.length,
      items: selectionProcesses,
      rejected,
    })),

    getByCidoId: vi.fn(async () => null),
  } satisfies SelectionProcessSource;

  const repository = {
    upsert: vi.fn(
      async (data: SelectionProcessSyncData) =>
        Number(data.cidoId),
    ),

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
    getBySelectionProcessCidoId: vi.fn(
      async (selectionProcessCidoId: string) => {
        if (
          selectionProcessCidoId ===
          failingDocumentsCidoId
        ) {
          throw new Error("CIDO no disponible");
        }

        return documents;
      },
    ),
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
    source,
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
      failed: 0,
      failures: [],
      institutionsProcessed: 1,
      subjectAreasProcessed: 2,
      documentsProcessed: 1,
    });
  });

  it("continúa con las demás convocatorias cuando falla una y registra el fallo", async () => {
    const {
      useCase,
      documentRepository,
    } = buildUseCase({
      documents: [
        buildDocument("400"),
      ],
      selectionProcesses: [
        selectionProcess,
        secondSelectionProcess,
      ],
      failingDocumentsCidoId:
        selectionProcess.cidoId,
    });

    const result = await useCase.execute({
      limit: 10,
      offset: 0,
    });

    expect(
      documentRepository.markMissingAsInactive,
    ).toHaveBeenCalledTimes(1);

    expect(
      documentRepository.markMissingAsInactive,
    ).toHaveBeenCalledWith(
      Number(secondSelectionProcess.cidoId),
      ["400"],
    );

    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual([
      {
        cidoId: selectionProcess.cidoId,
        message: "CIDO no disponible",
      },
    ]);
  });

  it("registra como fallos las convocatorias descartadas por el origen y sincroniza el resto", async () => {
    const rejection = {
      cidoId: "999",
      message: "Convocatoria de CIDO no válida",
    };

    const {
      useCase,
      repository,
    } = buildUseCase({
      documents: [],
      rejected: [rejection],
    });

    const result = await useCase.execute({
      limit: 10,
      offset: 0,
    });

    expect(
      repository.upsert,
    ).toHaveBeenCalledTimes(1);

    expect(
      repository.upsert,
    ).toHaveBeenCalledWith(
      selectionProcess,
      INSTITUTION_ID,
    );

    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual([
      rejection,
    ]);
  });

  it("propaga el error cuando no se puede leer la página", async () => {
    const {
      useCase,
      source,
      repository,
      documentRepository,
    } = buildUseCase({
      documents: [],
    });

    source.getPage.mockRejectedValueOnce(
      new Error("CIDO no disponible"),
    );

    await expect(
      useCase.execute({
        limit: 10,
        offset: 0,
      }),
    ).rejects.toThrow("CIDO no disponible");

    expect(
      repository.upsert,
    ).not.toHaveBeenCalled();

    expect(
      documentRepository.markMissingAsInactive,
    ).not.toHaveBeenCalled();
  });
});
