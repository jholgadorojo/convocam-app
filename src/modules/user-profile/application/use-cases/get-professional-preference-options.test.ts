
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ProfessionalPreferenceOptionsQueryRepository,
} from "../repositories/professional-preference-options-query.repository";

import { GetProfessionalPreferenceOptions } from "./get-professional-preference-options";

describe("GetProfessionalPreferenceOptions", () => {
  it("devuelve las opciones proporcionadas por el repositorio", async () => {
    const options = {
      subjectAreas: [
        { id: 10, name: "Administración" },
        { id: 20, name: "Informática" },
      ],
      qualificationGroups: ["A1", "A2", "C1"],
    };

    const listAll = vi.fn().mockResolvedValue(options);

    const repository: ProfessionalPreferenceOptionsQueryRepository = {
      listAll,
    };

    const useCase =
      new GetProfessionalPreferenceOptions(repository);

    const result = await useCase.execute();

    expect(result).toEqual(options);
    expect(listAll).toHaveBeenCalledOnce();
  });
});
