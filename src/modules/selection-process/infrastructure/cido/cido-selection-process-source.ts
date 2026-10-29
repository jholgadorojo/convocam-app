import { z } from "zod";

import type {
  SelectionProcessSource,
  SelectionProcessSourcePage,
  SelectionProcessSourceRejection,
} from "../../application/selection-process-source";

import type { SelectionProcessSyncData } from "../../application/selection-process-sync-data";

import {
  getCidoSelectionProcessById,
  getCidoSelectionProcesses,
} from "./cido-client";

import { mapCidoSelectionProcess } from "./cido-selection-process-mapper";
import { cidoSelectionProcessResourceSchema } from "./cido-types";
import { readCidoResourceId } from "./cido-validation";

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

    const items: SelectionProcessSyncData[] = [];
    const rejected: SelectionProcessSourceRejection[] = [];

    // Cada convocatoria se valida por separado: una mal
    // formada se descarta sin perder el resto de la página.
    for (const resource of response.data) {
      const result =
        cidoSelectionProcessResourceSchema.safeParse(
          resource,
        );

      if (result.success) {
        items.push(
          mapCidoSelectionProcess(result.data),
        );
        continue;
      }

      rejected.push({
        cidoId: readCidoResourceId(resource),
        message: `Convocatoria de CIDO no válida: ${z.prettifyError(result.error)}`,
      });
    }

    return {
      total: response.meta.totalResourceCount,
      items,
      rejected,
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