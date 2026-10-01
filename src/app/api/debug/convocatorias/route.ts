import { listActiveSelectionProcessesUseCase } from "@/composition/selection-process";

function getNumber(
  value: string | null,
): number | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isInteger(number)
    ? number
    : undefined;
}

function getBoolean(
  value: string | null,
): boolean | undefined {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function getDate(
  value: string | null,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Number(
    searchParams.get("page") ?? "1",
  );

  const pageSize = Number(
    searchParams.get("pageSize") ?? "20",
  );

  const result =
    await listActiveSelectionProcessesUseCase.execute({
      page,
      pageSize,

      filters: {
        text:
          searchParams.get("text") ??
          undefined,

        municipality:
          searchParams.get("municipality") ??
          undefined,

        county:
          searchParams.get("county") ??
          undefined,

        province:
          searchParams.get("province") ??
          undefined,

        statusId: getNumber(
          searchParams.get("statusId"),
        ),

        scopeId: getNumber(
          searchParams.get("scopeId"),
        ),

        selectionSystemId: getNumber(
          searchParams.get("selectionSystemId"),
        ),

        personnelTypeId: getNumber(
          searchParams.get("personnelTypeId"),
        ),

        qualificationGroup:
          searchParams.get(
            "qualificationGroup",
          ) ?? undefined,

        isJobPool: getBoolean(
          searchParams.get("isJobPool"),
        ),

        applicationEndDateFrom: getDate(
          searchParams.get(
            "applicationEndDateFrom",
          ),
        ),

        applicationEndDateTo: getDate(
          searchParams.get(
            "applicationEndDateTo",
          ),
        ),

        reservedDisability: getBoolean(
          searchParams.get(
            "reservedDisability",
          ),
        ),

        reservedUnemployed: getBoolean(
          searchParams.get(
            "reservedUnemployed",
          ),
        ),

        reservedYoung: getBoolean(
          searchParams.get(
            "reservedYoung",
          ),
        ),

        reservedWomen: getBoolean(
          searchParams.get(
            "reservedWomen",
          ),
        ),
      },
    });

  return Response.json(result);
}