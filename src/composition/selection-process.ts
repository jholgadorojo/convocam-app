import { prisma } from "@/shared/infrastructure/database/prisma";

import { SyncSelectionProcesses } from "@/modules/selection-process/application/sync-selection-processes";
import { CidoInstitutionSource } from "@/modules/selection-process/infrastructure/cido/cido-institution-source";
import { CidoSelectionProcessSource } from "@/modules/selection-process/infrastructure/cido/cido-selection-process-source";
import { PrismaInstitutionRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-institution-repository";
import { PrismaSelectionProcessRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-repository";
import { CidoSubjectAreaSource } from "@/modules/selection-process/infrastructure/cido/cido-subject-area-source";
import { PrismaSubjectAreaRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-subject-area-repository";
import { PrismaSelectionProcessSubjectAreaRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-subject-area-repository";

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

export const syncSelectionProcessesUseCase =
  new SyncSelectionProcesses(
    selectionProcessSource,
    selectionProcessRepository,
    institutionSource,
    institutionRepository,
    subjectAreaSource,
    subjectAreaRepository,
    selectionProcessSubjectAreaRepository,
  );