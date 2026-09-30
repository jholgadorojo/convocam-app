import { NextResponse } from "next/server";

import { getCidoSelectionProcesses } from "@/modules/selection-process/infrastructure/cido/cido-client";
import { mapCidoSelectionProcess } from "@/modules/selection-process/infrastructure/cido/cido-selection-process-mapper";

export async function GET() {
  try {
    const response = await getCidoSelectionProcesses({
      limit: 5,
      offset: 0,
    });

    const selectionProcesses =
      response.data.map(mapCidoSelectionProcess);

    return NextResponse.json({
      total: response.meta.totalResourceCount,
      count: selectionProcesses.length,
      data: selectionProcesses,
    });
  } catch (error) {
    console.error(
      "Error consultando CIDO:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se han podido obtener las convocatorias de CIDO",
      },
      {
        status: 500,
      },
    );
  }
}