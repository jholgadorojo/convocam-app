import { NextResponse } from "next/server";

import { runSelectionProcessSyncUseCase } from "@/composition/selection-process";

export async function POST() {
  try {
    const result =
      await runSelectionProcessSyncUseCase.execute();

    return NextResponse.json({
      message:
        "Sincronización completa finalizada",
      ...result,
    });
  } catch (error) {
    console.error(
      "Error en la sincronización completa de CIDO:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se ha podido completar la sincronización de CIDO",
      },
      {
        status: 500,
      },
    );
  }
}