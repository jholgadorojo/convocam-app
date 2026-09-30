import { NextResponse } from "next/server";

import { syncSelectionProcessesUseCase } from "@/composition/selection-process";

export async function POST() {
  try {
    const result =
      await syncSelectionProcessesUseCase.execute({
        limit: 5,
        offset: 0,
      });

    return NextResponse.json({
      message: "Sincronización completada",
      ...result,
    });
  } catch (error) {
    console.error(
      "Error sincronizando convocatorias de CIDO:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se han podido sincronizar las convocatorias",
      },
      {
        status: 500,
      },
    );
  }
}