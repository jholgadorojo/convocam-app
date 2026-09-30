import { NextRequest, NextResponse } from "next/server";

import { getCidoInstitution } from "@/modules/selection-process/infrastructure/cido/cido-client";
import { mapCidoInstitution } from "@/modules/selection-process/infrastructure/cido/cido-institution-mapper";

export async function GET(
  request: NextRequest,
) {
  try {
    const cidoId =
      request.nextUrl.searchParams.get("cidoId");

    if (!cidoId) {
      return NextResponse.json(
        {
          error:
            "Falta el parámetro cidoId",
        },
        {
          status: 400,
        },
      );
    }

    const response =
      await getCidoInstitution(cidoId);

    if (!response.data) {
      return NextResponse.json(
        {
          error:
            "La convocatoria no tiene institución asociada",
        },
        {
          status: 404,
        },
      );
    }

    const institution =
      mapCidoInstitution(response.data);

    return NextResponse.json({
      institution,
    });
  } catch (error) {
    console.error(
      "Error consultando institución CIDO:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se ha podido obtener la institución",
      },
      {
        status: 500,
      },
    );
  }
}