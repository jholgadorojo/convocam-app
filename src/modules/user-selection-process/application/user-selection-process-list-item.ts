import type { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

export type UserSelectionProcessListItem = {
  id: number;

  personalStatus:
  PersonalSelectionProcessStatus;

  followedAt: Date;

  personalStatusUpdatedAt: Date;

  selectionProcess: {
    id: number;

    cidoIdentifier: string;

    title: string;

    isJobPool: boolean;

    statusId: number;

    status: string;

    applicationStartDate: Date | null;

    applicationEndDate: Date | null;

    qualificationGroup: string | null;

    numberOfPositions: number | null;

    personnelType: string | null;

    selectionSystem: string | null;

    scope: string | null;

    reservedPlaces: {
      disability: number | null;
      unemployed: boolean;
      youngPeople: boolean;
      women: boolean;
    };

    sourceActive: boolean;

    cidoUrl: string;

    institution: {
      name: string;
      municipality: string | null;
      county: string | null;
      province: string | null;
    } | null;

    latestDocument: {
      publicationDate: Date;
      documentUrl: string;
      htmlUrl: string | null;
    } | null;
  };
};