import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  SyncSelectionProcesses,
  SyncSelectionProcessesResult,
} from "./sync-selection-processes";

import { SyncAllSelectionProcesses } from "./sync-all-selection-processes";

function buildPageResult(
  overrides: Partial<SyncSelectionProcessesResult>,
): SyncSelectionProcessesResult {
  return {
    totalAvailable: 0,
    processed: 0,
    failed: 0,
    failures: [],
    institutionsProcessed: 0,
    subjectAreasProcessed: 0,
    documentsProcessed: 0,
    ...overrides,
  };
}

function buildUseCase(
  pages: SyncSelectionProcessesResult[],
) {
  const execute = vi.fn(
    async (_params: {
      limit: number;
      offset: number;
    }) => {
      const page = pages.shift();

      if (!page) {
        throw new Error("No hay más páginas en el test");
      }

      return page;
    },
  );

  // SyncSelectionProcesses es una clase con miembros
  // privados, así que el doble necesita el cast.
  const syncSelectionProcesses = {
    execute,
  } as unknown as SyncSelectionProcesses;

  return {
    useCase: new SyncAllSelectionProcesses(
      syncSelectionProcesses,
    ),
    execute,
  };
}

describe("SyncAllSelectionProcesses", () => {
  it("recorre todas las páginas y acumula los fallos", async () => {
    const { useCase } = buildUseCase([
      buildPageResult({
        totalAvailable: 3,
        processed: 2,
        failed: 1,
        failures: [
          {
            cidoId: "1",
            message: "CIDO no disponible",
          },
        ],
      }),
      buildPageResult({
        totalAvailable: 3,
        processed: 1,
        failed: 1,
        failures: [
          {
            cidoId: "3",
            message: "Tiempo de espera agotado",
          },
        ],
      }),
    ]);

    const result = await useCase.execute({
      pageSize: 2,
    });

    expect(result.pagesProcessed).toBe(2);
    expect(result.totalAvailable).toBe(3);
    expect(result.processed).toBe(3);
    expect(result.failed).toBe(2);
    expect(result.failures).toEqual([
      {
        cidoId: "1",
        message: "CIDO no disponible",
      },
      {
        cidoId: "3",
        message: "Tiempo de espera agotado",
      },
    ]);
  });

  it("no se detiene antes de la última página aunque fallen convocatorias", async () => {
    const { useCase, execute } = buildUseCase([
      buildPageResult({
        totalAvailable: 4,
        processed: 2,
        failed: 2,
        failures: [
          {
            cidoId: "1",
            message: "CIDO no disponible",
          },
          {
            cidoId: "2",
            message: "CIDO no disponible",
          },
        ],
      }),
      buildPageResult({
        totalAvailable: 4,
        processed: 2,
      }),
    ]);

    const result = await useCase.execute({
      pageSize: 2,
    });

    expect(execute).toHaveBeenCalledTimes(2);

    expect(execute).toHaveBeenNthCalledWith(2, {
      limit: 2,
      offset: 2,
    });

    expect(result.pagesProcessed).toBe(2);
    expect(result.processed).toBe(4);
    expect(result.failed).toBe(2);
  });
});
