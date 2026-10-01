import { getSelectionProcessFilterOptionsUseCase } from "@/composition/selection-process";

export async function GET() {
  const options =
    await getSelectionProcessFilterOptionsUseCase.execute();

  return Response.json(options);
}