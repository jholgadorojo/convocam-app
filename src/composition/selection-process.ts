import { prisma } from "@/lib/prisma";

import { SyncSelectionProcesses } from "@/modules/selection-process/application/sync-selection-processes";
import { CidoSelectionProcessSource } from "@/modules/selection-process/infrastructure/cido/cido-selection-process-source";
import { PrismaSelectionProcessRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-repository";

const selectionProcessSource =
  new CidoSelectionProcessSource();

const selectionProcessRepository =
  new PrismaSelectionProcessRepository(prisma);

export const syncSelectionProcessesUseCase =
  new SyncSelectionProcesses(
    selectionProcessSource,
    selectionProcessRepository,
  );