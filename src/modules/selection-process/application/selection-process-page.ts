import type { SelectionProcessListItem } from "./selection-process-list-item";

export type SelectionProcessPage = {
  items: SelectionProcessListItem[];

  page: number;
  pageSize: number;

  totalItems: number;
  totalPages: number;
};