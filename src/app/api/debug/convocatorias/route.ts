import { listActiveSelectionProcessesUseCase } from "@/composition/selection-process";

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
    });

  return Response.json(result);
}