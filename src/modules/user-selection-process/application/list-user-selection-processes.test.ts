import {
  describe,
  expect,
  it,
} from "vitest";

import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

import type { UserSelectionProcessListItem } from "./user-selection-process-list-item";
import type { UserSelectionProcessQueryRepository } from "./user-selection-process-query-repository";

import { ListUserSelectionProcesses } from "./list-user-selection-processes";

class FakeUserSelectionProcessQueryRepository
  implements UserSelectionProcessQueryRepository
{
  public receivedUserId:
    | string
    | null = null;

  constructor(
    private readonly items: UserSelectionProcessListItem[],
  ) {}

  async findByUser(
    userId: string,
  ): Promise<
    UserSelectionProcessListItem[]
  > {
    this.receivedUserId =
      userId;

    return this.items;
  }
}

describe(
  "ListUserSelectionProcesses",
  () => {
    it(
      "devuelve las convocatorias seguidas por el usuario",
      async () => {
        const followedAt =
          new Date(
            "2026-10-01T10:00:00.000Z",
          );

        const personalStatusUpdatedAt =
          new Date(
            "2026-10-10T12:30:45.000Z",
          );

        const latestDocumentDate =
          new Date(
            "2026-10-08T00:00:00.000Z",
          );

        const items: UserSelectionProcessListItem[] =
          [
            {
              id: 1,

              personalStatus:
                PersonalSelectionProcessStatus.EXAM_PENDING,

              followedAt,

              personalStatusUpdatedAt,

              selectionProcess: {
                id: 100,

                cidoIdentifier:
                  "CIDO-100",

                title:
                  "Tècnic/a Superior en Informàtica",

                isJobPool: false,

                statusId: 2,

                status:
                  "En procés",

                applicationStartDate:
                  new Date(
                    "2026-10-01T00:00:00.000Z",
                  ),

                applicationEndDate:
                  new Date(
                    "2026-10-20T00:00:00.000Z",
                  ),

                qualificationGroup:
                  "A1",

                numberOfPositions:
                  2,

                personnelType:
                  "Funcionari",

                selectionSystem:
                  "Concurs oposició",

                scope:
                  "Administració local",

                reservedPlaces: {
                  disability:
                    1,

                  unemployed:
                    false,

                  youngPeople:
                    false,

                  women:
                    true,
                },

                sourceActive:
                  true,

                cidoUrl:
                  "https://cido.example/100",

                latestDocument:
                  {
                    publicationDate:
                      latestDocumentDate,

                    documentUrl:
                      "https://example.com/document.pdf",

                    htmlUrl:
                      "https://example.com/document",
                  },

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
            },
          ];

        const repository =
          new FakeUserSelectionProcessQueryRepository(
            items,
          );

        const useCase =
          new ListUserSelectionProcesses(
            repository,
          );

        const result =
          await useCase.execute(
            "user-123",
          );

        expect(
          repository.receivedUserId,
        ).toBe(
          "user-123",
        );

        expect(result).toEqual(
          items,
        );
      },
    );

    it(
      "devuelve una lista vacía cuando el usuario no sigue ninguna convocatoria",
      async () => {
        const repository =
          new FakeUserSelectionProcessQueryRepository(
            [],
          );

        const useCase =
          new ListUserSelectionProcesses(
            repository,
          );

        const result =
          await useCase.execute(
            "user-empty",
          );

        expect(
          repository.receivedUserId,
        ).toBe(
          "user-empty",
        );

        expect(result).toEqual(
          [],
        );
      },
    );
  },
);