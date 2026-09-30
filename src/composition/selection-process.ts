import { prisma } from "@/shared/infrastructure/database/prisma";

import { SyncAllSelectionProcesses } from "@/modules/selection-process/application/sync-all-selection-processes";
import { SyncSelectionProcesses } from "@/modules/selection-process/application/sync-selection-processes";

import { CidoInstitutionSource } from "@/modules/selection-process/infrastructure/cido/cido-institution-source";
import { CidoSelectionProcessDocumentSource } from "@/modules/selection-process/infrastructure/cido/cido-selection-process-document-source";
import { CidoSelectionProcessSource } from "@/modules/selection-process/infrastructure/cido/cido-selection-process-source";
import { CidoSubjectAreaSource } from "@/modules/selection-process/infrastructure/cido/cido-subject-area-source";

import { PrismaInstitutionRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-institution-repository";
import { PrismaSelectionProcessDocumentRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-document-repository";
import { PrismaSelectionProcessRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-repository";
import { PrismaSelectionProcessSubjectAreaRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-subject-area-repository";
import { PrismaSubjectAreaRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-subject-area-repository";
import { ReconcileMissingSelectionProcesses } from "@/modules/selection-process/application/reconcile-missing-selection-processes";
import { RunSelectionProcessSync } from "@/modules/selection-process/application/run-selection-process-sync";

const selectionProcessSource =
  new CidoSelectionProcessSource();

const selectionProcessRepository =
  new PrismaSelectionProcessRepository(
    prisma,
  );

const institutionSource =
  new CidoInstitutionSource();

const institutionRepository =
  new PrismaInstitutionRepository(
    prisma,
  );

const subjectAreaSource =
  new CidoSubjectAreaSource();

const subjectAreaRepository =
  new PrismaSubjectAreaRepository(
    prisma,
  );

const selectionProcessSubjectAreaRepository =
  new PrismaSelectionProcessSubjectAreaRepository(
    prisma,
  );

const documentSource =
  new CidoSelectionProcessDocumentSource();

const documentRepository =
  new PrismaSelectionProcessDocumentRepository(
    prisma,
  );

export const syncSelectionProcessesUseCase =
  new SyncSelectionProcesses(
    selectionProcessSource,
    selectionProcessRepository,
    institutionSource,
    institutionRepository,
    subjectAreaSource,
    subjectAreaRepository,
    selectionProcessSubjectAreaRepository,
    documentSource,
    documentRepository,
  );

export const syncAllSelectionProcessesUseCase =
  new SyncAllSelectionProcesses(
    syncSelectionProcessesUseCase,
  );

  const reconcileMissingSelectionProcessesUseCase =
  new ReconcileMissingSelectionProcesses(
    selectionProcessSource,
    selectionProcessRepository,
  );

export const runSelectionProcessSyncUseCase =
  new RunSelectionProcessSync(
    syncAllSelectionProcessesUseCase,
    reconcileMissingSelectionProcessesUseCase,
  );