import { describe, expect, it, vi } from "vitest";

import {
  MunicipalityListItem,
  MunicipalityQueryRepository,
} from "../repositories/municipality-query.repository";

import { ListMunicipalities } from "./list-municipalities";

describe("ListMunicipalities", () => {
  const municipalities: MunicipalityListItem[] = [
    {
      id: 1,
      code: "080018",
      name: "Abrera",
      countyName: "Baix Llobregat",
      provinceName: "Barcelona",
    },
    {
      id: 2,
      code: "080462",
      name: "Cardedeu",
      countyName: "Vallès Oriental",
      provinceName: "Barcelona",
    },
  ];

  function setup(data: MunicipalityListItem[] = municipalities) {
    const listAll = vi.fn(async () => data);

    const municipalityRepository: MunicipalityQueryRepository = {
      existsById: vi.fn(async () => false),
      listAll,
    };

    const useCase = new ListMunicipalities(
      municipalityRepository,
    );

    return {
      useCase,
      listAll,
    };
  }

  it("devuelve los municipios con comarca y provincia", async () => {
    const { useCase, listAll } = setup();

    const result = await useCase.execute();

    expect(result).toEqual(municipalities);
    expect(listAll).toHaveBeenCalledOnce();
  });

  it("devuelve una lista vacía si no hay municipios", async () => {
    const { useCase, listAll } = setup([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(listAll).toHaveBeenCalledOnce();
  });
});