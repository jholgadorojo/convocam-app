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

describe(
  "ListActiveSelectionProcesses",
  () => {
    it(
      "uses page 1 and pageSize 20 by default",
      async () => {
        const repository =
          new FakeSelectionProcessQueryRepository();

        repository.findActive.mockResolvedValue(
          createEmptyPage(
            1,
            20,
          ),
        );

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
      },
    );

    it(
      "uses the provided page and pageSize",
      async () => {
        const repository =
          new FakeSelectionProcessQueryRepository();

        repository.findActive.mockResolvedValue(
          createEmptyPage(
            2,
            10,
          ),
        );

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
      },
    );

    it(
      "passes filters unchanged to the repository",
      async () => {
        const repository =
          new FakeSelectionProcessQueryRepository();

        repository.findActive.mockResolvedValue(
          createEmptyPage(
            1,
            20,
          ),
        );

        const useCase =
          new ListActiveSelectionProcesses(
            repository,
          );

        const filters:
          SelectionProcessSearchFilters = {
            text:
              "informatic",

            qualificationGroup: [
              "A1",
              "A2",
            ],

            isJobPool:
              false,

            statusId:
              1,

            province:
              "Barcelona",

            county:
              "Vallès Oriental",

            municipality:
              "Cardedeu",

            scopeId:
              2,

            selectionSystemId:
              3,

            personnelTypeId:
              4,

            applicationEndDateFrom:
              new Date(
                "2026-10-01",
              ),

            applicationEndDateTo:
              new Date(
                "2026-10-31",
              ),

            reservedDisability:
              true,

            reservedUnemployed:
              true,

            reservedYoung:
              true,

            reservedWomen:
              true,
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
      },
    );

    it(
      "returns the repository result unchanged",
      async () => {
        const repository =
          new FakeSelectionProcessQueryRepository();

        const expectedResult:
          SelectionProcessPage = {
          items: [
            {
              id: 18,

              cidoIdentifier:
                "test-18",

              title:
                "Tècnic informàtic",

              isJobPool:
                false,

              /*
               * Estado oficial
               */
              statusId:
                1,

              status:
                "Termini obert",

              /*
               * Periodo de solicitud
               */
              applicationStartDate:
                new Date(
                  "2026-10-01",
                ),

              applicationEndDate:
                new Date(
                  "2026-10-31",
                ),

              /*
               * Información resumida
               */
              numberOfPositions:
                2,

              qualificationGroup:
                "A2",

              personnelType:
                "Funcionari",

              selectionSystem:
                "Concurs oposició",

              scope:
                "Administració local",

              /*
               * Reservas
               */
              reservedPlaces: {
                disability:
                  1,

                unemployed:
                  false,

                youngPeople:
                  false,

                women:
                  false,
              },

              /*
               * Fuente
               */
              cidoUrl:
                "https://cido.diba.cat/test-18",

              /*
               * Institución
               */
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

          page:
            1,

          pageSize:
            20,

          totalItems:
            1,

          totalPages:
            1,
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

        expect(
          result,
        ).toBe(
          expectedResult,
        );
      },
    );

    it(
      "throws when page is 0",
      async () => {
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
      },
    );

    it(
      "throws when page is not an integer",
      async () => {
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
      },
    );

    it(
      "throws when pageSize is 0",
      async () => {
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
      },
    );

    it(
      "throws when pageSize is greater than 100",
      async () => {
        const repository =
          new FakeSelectionProcessQueryRepository();

        const useCase =
          new ListActiveSelectionProcesses(
            repository,
          );

        await expect(
          useCase.execute({
            pageSize:
              101,
          }),
        ).rejects.toThrow(
          "pageSize must be an integer between 1 and 100",
        );

        expect(
          repository.findActive,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "throws when pageSize is not an integer",
      async () => {
        const repository =
          new FakeSelectionProcessQueryRepository();

        const useCase =
          new ListActiveSelectionProcesses(
            repository,
          );

        await expect(
          useCase.execute({
            pageSize:
              10.5,
          }),
        ).rejects.toThrow(
          "pageSize must be an integer between 1 and 100",
        );

        expect(
          repository.findActive,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

function createEmptyPage(
  page: number,
  pageSize: number,
): SelectionProcessPage {
  return {
    items: [],
    page,
    pageSize,
    totalItems: 0,
    totalPages: 0,
  };
}