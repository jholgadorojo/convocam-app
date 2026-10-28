import type { UserSelectionProcess } from "./user-selection-process";

/**
 * save() lanza SelectionProcessNotFoundError al crear
 * un seguimiento de una convocatoria que no existe.
 */
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