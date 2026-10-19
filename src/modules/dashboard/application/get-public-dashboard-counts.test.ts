
import { describe, expect, it, vi } from "vitest";

import { ListActiveSelectionProcesses } from
  "@/modules/selection-process/application/list-active-selection-processes";

import type { SelectionProcessPage } from
  "@/modules/selection-process/application/selection-process-page";

import type { SelectionProcessQueryRepository } from
  "@/modules/selection-process/application/selection-process-query-repository";

import type { SelectionProcessSearchFilters } from
  "@/modules/selection-process/application/selection-process-search-filters";

import { GetPublicDashboardCounts } from
  "./get-public-dashboard-counts";

/**
 * Crea una respuesta simulada del buscador.
 *
 * Se devuelve una lista vacía porque este caso
 * de uso solamente necesita totalItems.
 */
function createPage(
  totalItems: number,
): SelectionProcessPage {
  return {
    items: [],
    page: 1,
    pageSize: 1,
    totalItems,
    totalPages: totalItems,
  };
}

/**
 * Prepara el caso de uso con un repositorio simulado.
 *
 * No necesita conectarse a PostgreSQL.
 *
 * Estado 3: plazo abierto.
 * Estado 2: pendiente de plazo.
 */
function createTestContext(
  options: {
    openTotal?: number;
    pendingTotal?: number;
  } = {},
) {
  const openTotal = options.openTotal ?? 12;
  const pendingTotal = options.pendingTotal ?? 7;

  const findActive = vi.fn(
    async (
      _page: number,
      _pageSize: number,
      filters: SelectionProcessSearchFilters,
    ): Promise<SelectionProcessPage> => {
      const statusIds = filters.statusId;

      if (
        Array.isArray(statusIds) &&
        statusIds.length === 1 &&
        statusIds[0] === 3
      ) {
        return createPage(openTotal);
      }

      if (
        Array.isArray(statusIds) &&
        statusIds.length === 1 &&
        statusIds[0] === 2
      ) {
        return createPage(pendingTotal);
      }

      throw new Error(
        "Filtro de estado CIDO inesperado.",
      );
    },
  );

  const repository: SelectionProcessQueryRepository = {
    findActive,

    getFilterOptions: async () => ({
      municipalities: [],
      counties: [],
      provinces: [],
      territories: [],
      statuses: [],
      scopes: [],
      selectionSystems: [],
      personnelTypes: [],
      qualificationGroups: [],
      subjectAreas: [],
    }),
  };

  const useCase = new GetPublicDashboardCounts(
    new ListActiveSelectionProcesses(repository),
  );

  return {
    useCase,
    findActive,
  };
}

describe("GetPublicDashboardCounts", () => {
  it("consulta los estados oficiales CIDO correctos", async () => {
    const context = createTestContext({
      openTotal: 12,
      pendingTotal: 7,
    });

    const result = await context.useCase.execute();

    expect(result).toEqual({
      openCount: 12,
      pendingCount: 7,
    });

    expect(context.findActive).toHaveBeenCalledTimes(2);

    expect(context.findActive).toHaveBeenNthCalledWith(
      1,
      1,
      1,
      {
        statusId: [3],
      },
    );

    expect(context.findActive).toHaveBeenNthCalledWith(
      2,
      1,
      1,
      {
        statusId: [2],
      },
    );
  });

  it("utiliza totalItems y no el número de resultados recuperados", async () => {
    const context = createTestContext({
      openTotal: 1250,
      pendingTotal: 430,
    });

    const result = await context.useCase.execute();

    expect(result.openCount).toBe(1250);
    expect(result.pendingCount).toBe(430);

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({
        statusId: [3],
      }),
    );

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({
        statusId: [2],
      }),
    );
  });

  it("devuelve cero cuando no existen convocatorias", async () => {
    const context = createTestContext({
      openTotal: 0,
      pendingTotal: 0,
    });

    const result = await context.useCase.execute();

    expect(result).toEqual({
      openCount: 0,
      pendingCount: 0,
    });

    expect(context.findActive).toHaveBeenCalledTimes(2);
  });

  it("propaga los errores del repositorio", async () => {
    const context = createTestContext();

    context.findActive.mockRejectedValueOnce(
      new Error("Error de PostgreSQL"),
    );

    await expect(
      context.useCase.execute(),
    ).rejects.toThrow(
      "Error de PostgreSQL",
    );
  });
});
