import { prisma } from "@/shared/infrastructure/database/prisma";

import { SyncSelectionProcesses } from "@/modules/selection-process/application/sync-selection-processes";
import { CidoInstitutionSource } from "@/modules/selection-process/infrastructure/cido/cido-institution-source";
import { CidoSelectionProcessSource } from "@/modules/selection-process/infrastructure/cido/cido-selection-process-source";
import { PrismaInstitutionRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-institution-repository";
import { PrismaSelectionProcessRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-repository";

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

export const syncSelectionProcessesUseCase =
  new SyncSelectionProcesses(
    selectionProcessSource,
    selectionProcessRepository,
    institutionSource,
    institutionRepository,
  );