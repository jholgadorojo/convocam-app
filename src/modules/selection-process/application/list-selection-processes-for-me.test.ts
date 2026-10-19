
import { describe, expect, it, vi } from "vitest";

import { ListActiveSelectionProcesses } from "./list-active-selection-processes";
import { ListSelectionProcessesForMe } from "./list-selection-processes-for-me";

import type { SelectionProcessPage } from "./selection-process-page";
import type { SelectionProcessQueryRepository } from "./selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

type TerritorialPreferences = {
  scope: "ALL_CATALONIA" | "SELECTED_TERRITORIES";
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};

type ProfessionalPreferences = {
  selectionProcessType:
    | "POSITIONS"
    | "JOB_POOLS"
    | "BOTH"
    | null;

  subjectAreaIds: number[];
  qualificationGroups: string[];
};

/**
 * Genera una página simulada para las pruebas.
 *
 * SPEC-009 permite utilizar un tamaño diferente
 * de los 10 resultados habituales de SPEC-008.
 */
function createPage(
  page = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = totalPages * pageSize,
): SelectionProcessPage {
  return {
    items: [],
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

/**
 * Prepara los colaboradores del caso de uso.
 *
 * Se simula el repositorio para comprobar
 * qué filtros y parámetros recibe.
 */
function createTestContext(
  options: {
    territorial?: TerritorialPreferences | null;
    professional?: ProfessionalPreferences | null;
    results?: SelectionProcessPage[];
  } = {},
) {
  const queuedResults = [...(options.results ?? [])];

  const findActive = vi.fn(
    async (
      page: number,
      _pageSize: number,
      _filters: SelectionProcessSearchFilters,
    ): Promise<SelectionProcessPage> => {
      return queuedResults.shift() ?? createPage(page);
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

  const territorialReader = {
    execute: vi.fn(
      async (
        _input: { userId: string },
      ): Promise<TerritorialPreferences | null> => {
        return options.territorial ?? null;
      },
    ),
  };

  const professionalReader = {
    execute: vi.fn(
      async (
        _input: { userId: string },
      ): Promise<ProfessionalPreferences | null> => {
        return options.professional ?? null;
      },
    ),
  };

  const useCase = new ListSelectionProcessesForMe(
    territorialReader,
    professionalReader,
    new ListActiveSelectionProcesses(repository),
  );

  return {
    useCase,
    findActive,
    territorialReader,
    professionalReader,
  };
}

describe("ListSelectionProcessesForMe", () => {
  /**
   * ============================================================
   * SPEC-008 — COMPORTAMIENTO EXISTENTE
   * ============================================================
   */

  it("solicita las preferencias del usuario indicado", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(
      context.territorialReader.execute,
    ).toHaveBeenCalledWith({
      userId: "user-1",
    });

    expect(
      context.professionalReader.execute,
    ).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });

  it("no busca convocatorias si no hay preferencias", async () => {
    const context = createTestContext();

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result).toEqual({
      kind: "preferences-not-configured",
    });

    expect(context.findActive).not.toHaveBeenCalled();
  });

  it("no considera configuradas las preferencias profesionales vacías", async () => {
    const context = createTestContext({
      professional: {
        selectionProcessType: null,
        subjectAreaIds: [],
        qualificationGroups: [],
      },
    });

    const result = await context.useCase.execute({
      userId: "user-1",
    });

    expect(result.kind).toBe(
      "preferences-not-configured",
    );

    expect(context.findActive).not.toHaveBeenCalled();
  });

  it("busca en toda Catalunya sin restringir territorios", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      10,
      {
        statusId: [2, 3],
        sort: "deadline-priority",
      },
    );
  });

  it("combina los territorios y las materias seleccionadas", async () => {
    const context = createTestContext({
      territorial: {
        scope: "SELECTED_TERRITORIES",
        provinceIds: [2],
        countyIds: [24],
        municipalityIds: [188],
      },
      professional: {
        selectionProcessType: "POSITIONS",
        subjectAreaIds: [12, 18],
        qualificationGroups: ["A1", "A2"],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      10,
      {
        statusId: [2, 3],
        sort: "deadline-priority",
        territorialIds: {
          provinceIds: [2],
          countyIds: [24],
          municipalityIds: [188],
        },
        isJobPool: false,
        subjectAreaIds: [12, 18],
        qualificationGroup: ["A1", "A2"],
      },
    );
  });

  it("filtra exclusivamente bolsas si así lo indica el perfil", async () => {
    const context = createTestContext({
      professional: {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [],
        qualificationGroups: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({
        isJobPool: true,
      }),
    );
  });

  it("no restringe el tipo cuando se seleccionan plazas y bolsas", async () => {
    const context = createTestContext({
      professional: {
        selectionProcessType: "BOTH",
        subjectAreaIds: [],
        qualificationGroups: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    const filters = context.findActive.mock.calls[0]?.[2];

    expect(filters).toBeDefined();
    expect(filters).not.toHaveProperty("isJobPool");
  });

  it("ajusta la página cuando supera el total disponible", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
      results: [
        createPage(99, 3),
        createPage(3, 3),
      ],
    });

    const result = await context.useCase.execute({
      userId: "user-1",
      page: 99,
    });

    expect(context.findActive).toHaveBeenCalledTimes(2);

    expect(
      context.findActive.mock.calls[0]?.[0],
    ).toBe(99);

    expect(
      context.findActive.mock.calls[1]?.[0],
    ).toBe(3);

    expect(result.kind).toBe("results");

    if (result.kind === "results") {
      expect(result.page.page).toBe(3);
    }
  });

  it("rechaza un usuario vacío", async () => {
    const context = createTestContext();

    await expect(
      context.useCase.execute({
        userId: "  ",
      }),
    ).rejects.toThrow("userId is required");

    expect(context.findActive).not.toHaveBeenCalled();
  });

  it("rechaza números de página inválidos", async () => {
    const context = createTestContext();

    await expect(
      context.useCase.execute({
        userId: "user-1",
        page: 0,
      }),
    ).rejects.toThrow(
      "page must be an integer greater than or equal to 1",
    );

    expect(context.findActive).not.toHaveBeenCalled();
  });

  /**
   * ============================================================
   * SPEC-009 — DASHBOARD DEL OPOSITOR
   * ============================================================
   */

  it("mantiene 10 resultados y no excluye seguimientos por defecto", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
    });

    expect(context.findActive).toHaveBeenCalledTimes(1);

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      10,
      {
        statusId: [2, 3],
        sort: "deadline-priority",
      },
    );

    const filters = context.findActive.mock.calls[0]?.[2];

    expect(filters).not.toHaveProperty(
      "excludeFollowedByUserId",
    );
  });

  it("solicita tres oportunidades excluyendo las seguidas para el dashboard", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
      page: 1,
      pageSize: 3,
      excludeFollowed: true,
    });

    expect(context.findActive).toHaveBeenCalledTimes(1);

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      3,
      {
        statusId: [2, 3],
        sort: "deadline-priority",
        excludeFollowedByUserId: "user-1",
      },
    );
  });

  it("combina la exclusión con las preferencias profesionales y territoriales", async () => {
    const context = createTestContext({
      territorial: {
        scope: "SELECTED_TERRITORIES",
        provinceIds: [2],
        countyIds: [24],
        municipalityIds: [188],
      },
      professional: {
        selectionProcessType: "JOB_POOLS",
        subjectAreaIds: [12, 18],
        qualificationGroups: ["C1", "C2"],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
      pageSize: 3,
      excludeFollowed: true,
    });

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      3,
      {
        statusId: [2, 3],
        sort: "deadline-priority",
        territorialIds: {
          provinceIds: [2],
          countyIds: [24],
          municipalityIds: [188],
        },
        isJobPool: true,
        subjectAreaIds: [12, 18],
        qualificationGroup: ["C1", "C2"],
        excludeFollowedByUserId: "user-1",
      },
    );
  });

  it("no excluye seguimientos cuando excludeFollowed es false", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
    });

    await context.useCase.execute({
      userId: "user-1",
      pageSize: 3,
      excludeFollowed: false,
    });

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      3,
      {
        statusId: [2, 3],
        sort: "deadline-priority",
      },
    );
  });

  it("conserva el total de oportunidades devuelto por el repositorio", async () => {
    const expectedPage = createPage(
      1,
      13,
      3,
      38,
    );

    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
      results: [expectedPage],
    });

    const result = await context.useCase.execute({
      userId: "user-1",
      pageSize: 3,
      excludeFollowed: true,
    });

    expect(result.kind).toBe("results");

    if (result.kind === "results") {
      expect(result.page.totalItems).toBe(38);
      expect(result.page.pageSize).toBe(3);
      expect(result.page.totalPages).toBe(13);
    }

    expect(context.findActive).toHaveBeenCalledTimes(1);
  });

  it("no consulta oportunidades del dashboard cuando faltan preferencias", async () => {
    const context = createTestContext();

    const result = await context.useCase.execute({
      userId: "user-1",
      pageSize: 3,
      excludeFollowed: true,
    });

    expect(result).toEqual({
      kind: "preferences-not-configured",
    });

    expect(context.findActive).not.toHaveBeenCalled();
  });

  it("utiliza el identificador de usuario sin espacios para la exclusión", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
    });

    await context.useCase.execute({
      userId: "  user-1  ",
      pageSize: 3,
      excludeFollowed: true,
    });

    expect(context.findActive).toHaveBeenCalledWith(
      1,
      3,
      expect.objectContaining({
        excludeFollowedByUserId: "user-1",
      }),
    );

    expect(
      context.territorialReader.execute,
    ).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });

  it("ajusta la paginación del dashboard manteniendo el filtro de exclusión", async () => {
    const context = createTestContext({
      territorial: {
        scope: "ALL_CATALONIA",
        provinceIds: [],
        countyIds: [],
        municipalityIds: [],
      },
      results: [
        createPage(99, 3, 3, 8),
        createPage(3, 3, 3, 8),
      ],
    });

    const result = await context.useCase.execute({
      userId: "user-1",
      page: 99,
      pageSize: 3,
      excludeFollowed: true,
    });

    expect(context.findActive).toHaveBeenCalledTimes(2);

    expect(context.findActive).toHaveBeenNthCalledWith(
      1,
      99,
      3,
      expect.objectContaining({
        excludeFollowedByUserId: "user-1",
      }),
    );

    expect(context.findActive).toHaveBeenNthCalledWith(
      2,
      3,
      3,
      expect.objectContaining({
        excludeFollowedByUserId: "user-1",
      }),
    );

    expect(result.kind).toBe("results");

    if (result.kind === "results") {
      expect(result.page.page).toBe(3);
      expect(result.page.totalItems).toBe(8);
    }
  });

  it.each([
    0,
    -1,
    1.5,
    101,
  ])(
    "rechaza un tamaño de página inválido: %s",
    async (pageSize) => {
      const context = createTestContext();

      await expect(
        context.useCase.execute({
          userId: "user-1",
          pageSize,
        }),
      ).rejects.toThrow(
        "pageSize must be an integer between 1 and 100",
      );

      expect(context.findActive).not.toHaveBeenCalled();
    },
  );
});
