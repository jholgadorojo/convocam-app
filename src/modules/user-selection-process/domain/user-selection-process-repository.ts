import type { UserSelectionProcess } from "./user-selection-process";

export interface UserSelectionProcessRepository {
  findByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<UserSelectionProcess | null>;

  findByUser(
    userId: string,
  ): Promise<UserSelectionProcess[]>;

  save(
    userSelectionProcess: UserSelectionProcess,
  ): Promise<UserSelectionProcess>;

  deleteByUserAndSelectionProcess(
    userId: string,
    selectionProcessId: number,
  ): Promise<void>;
}