import type { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

export type FollowSelectionProcessDto = {
  userId: string;
  selectionProcessId: number;
};

export type UserSelectionProcessDto = {
  id: number;
  userId: string;
  selectionProcessId: number;
  personalStatus: PersonalSelectionProcessStatus;
  followedAt: Date;
  personalStatusUpdatedAt: Date;
  updatedAt: Date;
};

export type UnfollowSelectionProcessDto = {
  userId: string;
  selectionProcessId: number;
};

export type ChangeSelectionProcessPersonalStatusDto = {
  userId: string;
  selectionProcessId: number;
  personalStatus: PersonalSelectionProcessStatus;
};

export type GetUserSelectionProcessDto = {
  userId: string;
  selectionProcessId: number;
};