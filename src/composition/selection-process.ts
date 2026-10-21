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

import { ListActiveSelectionProcesses } from "@/modules/selection-process/application/list-active-selection-processes";
import { ListSelectionProcessesForMe } from "@/modules/selection-process/application/list-selection-processes-for-me";

import { PrismaSelectionProcessQueryRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-query-repository";
import { GetSelectionProcessFilterOptions } from "@/modules/selection-process/application/get-selection-process-filter-options";

import { GetSelectionProcessDetail } from "@/modules/selection-process/application/use-cases/get-selection-process-detail";
import { PrismaSelectionProcessDetailRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-detail-repository";

import {
  getUserTerritorialPreferencesUseCase,
  getUserProfessionalPreferencesUseCase,
} from "@/composition/user-profile";

/**
 * ==========================================
 * SINCRONIZACIÓN CIDO
 * ==========================================
 */

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

/**
 * ==========================================
 * BUSCADOR DE CONVOCATORIAS — SPEC-004
 * ==========================================
 */

const selectionProcessQueryRepository =
  new PrismaSelectionProcessQueryRepository(
    prisma,
  );

export const listActiveSelectionProcessesUseCase =
  new ListActiveSelectionProcesses(
    selectionProcessQueryRepository,
  );

export const getSelectionProcessFilterOptionsUseCase =
  new GetSelectionProcessFilterOptions(
    selectionProcessQueryRepository,
  );

/**
 * ==========================================
 * PARA MÍ — SPEC-008
 * ==========================================
 *
 * Reutilizamos:
 * - Preferencias territoriales de SPEC-007.
 * - Preferencias profesionales de SPEC-007.
 * - Motor de búsqueda de SPEC-004.
 * - Consulta municipal del mapa de SPEC-010.
 */

export const listSelectionProcessesForMeUseCase =
  new ListSelectionProcessesForMe(
    getUserTerritorialPreferencesUseCase,
    getUserProfessionalPreferencesUseCase,
    listActiveSelectionProcessesUseCase,
    selectionProcessQueryRepository,
  );

/**
 * ==========================================
 * DETALLE DE CONVOCATORIA — SPEC-005
 * ==========================================
 */

const selectionProcessDetailRepository =
  new PrismaSelectionProcessDetailRepository(
    prisma,
  );

export const getSelectionProcessDetailUseCase =
  new GetSelectionProcessDetail(
    selectionProcessDetailRepository,
  );
