import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ListActiveSelectionProcesses } from "./list-active-selection-processes";

import type { SelectionProcessFilterOptions } from "./selection-process-filter-options";
import type { SelectionProcessPage } from "./selection-process-page";
import type { SelectionProcessQueryRepository } from "./selection-process-query-repository";
import type { SelectionProcessSearchFilters } from "./selection-process-search-filters";

class FakeSelectionProcessQueryRepository
  implements SelectionProcessQueryRepository
{
  findActive = vi.fn<
    (
      page: number,
      pageSize: number,
      filters: SelectionProcessSearchFilters,
    ) => Promise<SelectionProcessPage>
  >();

  getFilterOptions = vi.fn<
    () => Promise<SelectionProcessFilterOptions>
  >();
}

describe("ListActiveSelectionProcesses", () => {
  it("uses page 1 and pageSize 20 by default", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    repository.findActive.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    });

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await useCase.execute();

    expect(
      repository.findActive,
    ).toHaveBeenCalledWith(
      1,
      20,
      {},
    );
  });

  it("uses the page and pageSize received", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    repository.findActive.mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await useCase.execute({
      page: 2,
      pageSize: 10,
    });

    expect(
      repository.findActive,
    ).toHaveBeenCalledWith(
      2,
      10,
      {},
    );
  });

  it("passes filters to the repository", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    repository.findActive.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    });

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    const filters: SelectionProcessSearchFilters =
      {
        text: "informatic",
        province: "Barcelona",
        county: "Vallès Oriental",
        municipality: "Cardedeu",

        qualificationGroup: [
          "A2",
          "C1",
        ],

        isJobPool: false,
        statusId: 2,
        scopeId: 1,
        selectionSystemId: 3,
        personnelTypeId: 2,

        reservedDisability: true,
        reservedUnemployed: true,
        reservedYoung: true,
        reservedWomen: true,
      };

    await useCase.execute({
      filters,
    });

    expect(
      repository.findActive,
    ).toHaveBeenCalledWith(
      1,
      20,
      filters,
    );
  });

  it("returns the result received from the repository", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    const expectedResult: SelectionProcessPage =
      {
        items: [
          {
            id: 18,
            cidoIdentifier:
              "test-18",
            title:
              "Tècnic informàtic",
            isJobPool: false,
            applicationEndDate:
              new Date(
                "2026-10-31",
              ),
            qualificationGroup:
              "A2",
            status:
              "Termini obert",
            cidoUrl:
              "https://example.com",

            institution: {
              name:
                "Ajuntament de Cardedeu",
              municipality:
                "Cardedeu",
              county:
                "Vallès Oriental",
              province:
                "Barcelona",
            },
          },
        ],

        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      };

    repository.findActive.mockResolvedValue(
      expectedResult,
    );

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    const result =
      await useCase.execute();

    expect(result).toEqual(
      expectedResult,
    );
  });

  it("rejects a page lower than 1", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await expect(
      useCase.execute({
        page: 0,
      }),
    ).rejects.toThrow(
      "page must be an integer greater than or equal to 1",
    );

    expect(
      repository.findActive,
    ).not.toHaveBeenCalled();
  });

  it("rejects a non-integer page", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await expect(
      useCase.execute({
        page: 1.5,
      }),
    ).rejects.toThrow(
      "page must be an integer greater than or equal to 1",
    );

    expect(
      repository.findActive,
    ).not.toHaveBeenCalled();
  });

  it("rejects a pageSize lower than 1", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await expect(
      useCase.execute({
        pageSize: 0,
      }),
    ).rejects.toThrow(
      "pageSize must be an integer between 1 and 100",
    );

    expect(
      repository.findActive,
    ).not.toHaveBeenCalled();
  });

  it("rejects a pageSize greater than 100", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await expect(
      useCase.execute({
        pageSize: 101,
      }),
    ).rejects.toThrow(
      "pageSize must be an integer between 1 and 100",
    );

    expect(
      repository.findActive,
    ).not.toHaveBeenCalled();
  });

  it("rejects a non-integer pageSize", async () => {
    const repository =
      new FakeSelectionProcessQueryRepository();

    const useCase =
      new ListActiveSelectionProcesses(
        repository,
      );

    await expect(
      useCase.execute({
        pageSize: 10.5,
      }),
    ).rejects.toThrow(
      "pageSize must be an integer between 1 and 100",
    );

    expect(
      repository.findActive,
    ).not.toHaveBeenCalled();
  });
});