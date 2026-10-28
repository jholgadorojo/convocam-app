import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/infrastructure/database/prisma";

import type { SelectionProcessSyncRunResult } from "@/modules/selection-process/application/selection-process-sync-run-repository";
import { PrismaSelectionProcessSyncRunRepository } from "@/modules/selection-process/infrastructure/prisma/prisma-selection-process-sync-run-repository";

const HOUR_MS = 60 * 60 * 1000;

const repository =
  new PrismaSelectionProcessSyncRunRepository(
    prisma,
  );

const syncRunResult: SelectionProcessSyncRunResult = {
  sync: {
    syncStartedAt: new Date("2026-10-28T08:00:00.000Z"),
    totalAvailable: 2,
    processed: 2,
    failed: 1,
    failures: [
      {
        cidoId: "100",
        message: "CIDO no disponible",
      },
    ],
    pagesProcessed: 1,
  },
  reconciliation: {
    checked: 1,
    updated: 0,
    deactivated: 1,
  },
};

function twoHoursAgo(): Date {
  return new Date(Date.now() - 2 * HOUR_MS);
}

describe("PrismaSelectionProcessSyncRunRepository", () => {
  beforeAll(async () => {
    const database = await prisma.$queryRaw<
      Array<{ name: string }>
    >`
      SELECT current_database() AS name
    `;

    if (database[0]?.name !== "convocam_test") {
      throw new Error(
        "Los tests deben utilizar convocam_test",
      );
    }
  });

  /*
   * La tabla no tiene un identificador propio de los
   * tests, así que se vacía entera. Solo es posible
   * porque antes se ha comprobado que es convocam_test.
   */
  beforeEach(async () => {
    await prisma.selectionProcessSyncRun.deleteMany();
  });

  afterAll(async () => {
    await prisma.selectionProcessSyncRun.deleteMany();

    await prisma.$disconnect();
  });

  it("registra una sincronización en marcha", async () => {
    const id = await repository.start(twoHoursAgo());

    expect(id).not.toBeNull();

    const run =
      await prisma.selectionProcessSyncRun.findUniqueOrThrow({
        where: {
          id: id!,
        },
      });

    expect(run.status).toBe("RUNNING");
    expect(run.runningLock).toBe(true);
    expect(run.finishedAt).toBeNull();
  });

  it("no deja empezar otra mientras hay una en marcha", async () => {
    const firstId = await repository.start(twoHoursAgo());
    const secondId = await repository.start(twoHoursAgo());

    expect(firstId).not.toBeNull();
    expect(secondId).toBeNull();

    expect(
      await prisma.selectionProcessSyncRun.count(),
    ).toBe(1);
  });

  it("al completarla guarda el resultado y libera el bloqueo", async () => {
    const id = await repository.start(twoHoursAgo());

    await repository.complete(id!, syncRunResult);

    const run =
      await prisma.selectionProcessSyncRun.findUniqueOrThrow({
        where: {
          id: id!,
        },
      });

    expect(run.status).toBe("COMPLETED");
    expect(run.runningLock).toBeNull();
    expect(run.finishedAt).not.toBeNull();
    expect(run.result).toEqual({
      sync: {
        ...syncRunResult.sync,
        syncStartedAt: "2026-10-28T08:00:00.000Z",
      },
      reconciliation: syncRunResult.reconciliation,
    });

    expect(
      await repository.start(twoHoursAgo()),
    ).not.toBeNull();
  });

  it("al fallar guarda el error y libera el bloqueo", async () => {
    const id = await repository.start(twoHoursAgo());

    await repository.fail(id!, "CIDO no disponible");

    const run =
      await prisma.selectionProcessSyncRun.findUniqueOrThrow({
        where: {
          id: id!,
        },
      });

    expect(run.status).toBe("FAILED");
    expect(run.runningLock).toBeNull();
    expect(run.finishedAt).not.toBeNull();
    expect(run.error).toBe("CIDO no disponible");

    expect(
      await repository.start(twoHoursAgo()),
    ).not.toBeNull();
  });

  it("da por interrumpida una ejecución colgada y deja empezar otra", async () => {
    const staleRun =
      await prisma.selectionProcessSyncRun.create({
        data: {
          startedAt: new Date(Date.now() - 3 * HOUR_MS),
        },
      });

    const id = await repository.start(twoHoursAgo());

    expect(id).not.toBeNull();
    expect(id).not.toBe(staleRun.id);

    const updatedStaleRun =
      await prisma.selectionProcessSyncRun.findUniqueOrThrow({
        where: {
          id: staleRun.id,
        },
      });

    expect(updatedStaleRun.status).toBe("FAILED");
    expect(updatedStaleRun.runningLock).toBeNull();
    expect(updatedStaleRun.finishedAt).not.toBeNull();
    expect(updatedStaleRun.error).toBe(
      "La sincronización no terminó en el tiempo máximo y se ha dado por interrumpida",
    );
  });
});
