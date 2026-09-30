import type {
  SelectionProcessSource,
  SelectionProcessSourcePage,
} from "../../application/selection-process-source";

import type { SelectionProcessSyncData } from "../../application/selection-process-sync-data";

import {
  getCidoSelectionProcessById,
  getCidoSelectionProcesses,
} from "./cido-client";

import { mapCidoSelectionProcess } from "./cido-selection-process-mapper";

export class CidoSelectionProcessSource
  implements SelectionProcessSource
{
  async getPage({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<SelectionProcessSourcePage> {
    const response =
      await getCidoSelectionProcesses({
        limit,
        offset,
      });

    return {
      total: response.meta.totalResourceCount,
      items: response.data.map(
        mapCidoSelectionProcess,
      ),
    };
  }

  async getByCidoId(
    cidoId: string,
  ): Promise<SelectionProcessSyncData | null> {
    const response =
      await getCidoSelectionProcessById(
        cidoId,
      );

    if (!response.data) {
      return null;
    }

    return mapCidoSelectionProcess(
      response.data,
    );
  }
}