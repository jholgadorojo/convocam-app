import type { UserSelectionProcess } from "./user-selection-process";

/**
 * Error que lanza save() al crear un seguimiento
 * de una convocatoria que no existe.
 */
export const SELECTION_PROCESS_NOT_FOUND_ERROR =
  "La convocatoria no existe";

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