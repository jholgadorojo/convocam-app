import type { UserSelectionProcessListItem } from "./user-selection-process-list-item";

export interface UserSelectionProcessQueryRepository {
  findByUser(
    userId: string,
  ): Promise<UserSelectionProcessListItem[]>;
}