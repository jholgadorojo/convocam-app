import { describe, expect, it } from "vitest";

import {
  buildFilterFormKey,
  buildMapMarkers,
  buildPageHref,
  countAdvancedActiveFilters,
  getActiveFilterChips,
  parseSearchParams,
  toSearchFilters,
  type CurrentFilterState,
  type SearchParams,
} from "./search-presentation";

const statuses = [
  { id: 1, name: "Finalitzat" },
  { id: 2, name: "Pendent de termini" },
  { id: 3, name: " Termini obert " },
];

function parse(params: SearchParams) {
  return parseSearchParams(params, statuses);
}

describe("parseSearchParams", () => {
  it("sin parámetros: listado, página 1 y estados que admiten solicitud", () => {
    expect(parse({})).toEqual({
      query: "",
      view: "list",
      page: 1,
      filters: {
        sort: "deadline-asc",
        qualificationGroups: [],
        jobPoolValues: [],
        statusIds: [2, 3],
        applicationPeriod: undefined,
        province: undefined,
        county: undefined,
        municipality: undefined,
        radiusKm: undefined,
        scopeId: undefined,
        selectionSystemId: undefined,
        personnelTypeId: undefined,
        applicationEndDateFrom: undefined,
        applicationEndDateTo: undefined,
        reservedDisability: false,
        reservedUnemployed: false,
        reservedYoung: false,
        reservedWomen: false,
      },
    });
  });

  it("respeta los estados elegidos, aunque no se marque ninguno", () => {
    expect(parse({ statusId: ["1", "1", "x"] }).filters.statusIds).toEqual([1]);
    expect(parse({ statusFilterApplied: "1" }).filters.statusIds).toEqual([]);
  });

  it("ordena por relevancia solo si hay texto", () => {
    expect(parse({ q: "  auxiliar " })).toMatchObject({
      query: "auxiliar",
      filters: { sort: "relevance" },
    });
    expect(parse({ sort: "relevance" }).filters.sort).toBe("deadline-asc");
    expect(parse({ sort: "municipality-asc" }).filters.sort).toBe(
      "municipality-asc",
    );
    expect(parse({ sort: "inventado" }).filters.sort).toBe("deadline-asc");
  });

  it("aplica el radio solo con municipio y con un valor permitido", () => {
    expect(parse({ radiusKm: "25" }).filters.radiusKm).toBeUndefined();
    expect(
      parse({ municipality: "Terrassa", radiusKm: "25" }).filters.radiusKm,
    ).toBe(25);
    expect(
      parse({ municipality: "Terrassa", radiusKm: "30" }).filters.radiusKm,
    ).toBeUndefined();
  });

  it("descarta valores no válidos y duplicados", () => {
    const { page, view, filters } = parse({
      page: "0",
      view: "tabla",
      isJobPool: ["true", "true", "quizá"],
      qualificationGroup: [" A1 ", "A1", " "],
      applicationPeriod: "siempre",
      scopeId: "-3",
      province: "  ",
    });
    expect({ page, view }).toEqual({ page: 1, view: "list" });
    expect(filters).toMatchObject({
      jobPoolValues: ["true"],
      qualificationGroups: ["A1"],
      applicationPeriod: undefined,
      scopeId: undefined,
      province: undefined,
    });
  });
});

describe("toSearchFilters", () => {
  const filters = parse({}).filters;

  it.each([
    [[], undefined],
    [["false"], false],
    [["true"], true],
    [["false", "true"], undefined],
  ])("plaza/bolsa %j → isJobPool %s", (jobPoolValues, expected) => {
    expect(toSearchFilters("", { ...filters, jobPoolValues }).isJobPool).toBe(
      expected,
    );
  });

  it("omite los filtros vacíos y convierte las fechas", () => {
    const searchFilters = toSearchFilters("", {
      ...filters,
      statusIds: [],
      applicationEndDateFrom: "2026-11-01",
      applicationEndDateTo: "no-es-fecha",
      reservedWomen: true,
    });
    expect(searchFilters).toMatchObject({
      text: undefined,
      statusId: undefined,
      qualificationGroup: undefined,
      applicationEndDateFrom: new Date("2026-11-01T00:00:00.000Z"),
      applicationEndDateTo: undefined,
      reservedWomen: true,
      reservedDisability: undefined,
    });
  });
});

describe("buildPageHref", () => {
  const fullFilters: CurrentFilterState = {
    sort: "deadline-desc",
    qualificationGroups: ["A1", "C2"],
    jobPoolValues: ["false"],
    statusIds: [2],
    applicationPeriod: "open",
    province: "Barcelona",
    county: "Vallès Occidental",
    municipality: "Terrassa",
    radiusKm: 10,
    scopeId: 4,
    selectionSystemId: 5,
    personnelTypeId: 6,
    applicationEndDateFrom: "2026-11-01",
    applicationEndDateTo: "2026-12-31",
    reservedDisability: true,
    reservedUnemployed: false,
    reservedYoung: true,
    reservedWomen: false,
  };

  it("incluye la vista, el texto, los filtros y la página", () => {
    const href = buildPageHref(3, "auxiliar", parse({}).filters, "map");
    expect(href).toBe(
      "/convocatorias?view=map&q=auxiliar&sort=deadline-asc" +
        "&statusFilterApplied=1&statusId=2&statusId=3&page=3",
    );
  });

  it("vuelve a leer los mismos filtros que genera", () => {
    const href = buildPageHref(2, "tècnic", fullFilters);
    const params = new URLSearchParams(href.split("?")[1]);
    const searchParams: SearchParams = Object.fromEntries(params);
    searchParams.qualificationGroup = params.getAll("qualificationGroup");
    searchParams.statusId = params.getAll("statusId");
    searchParams.isJobPool = params.getAll("isJobPool");

    expect(parse(searchParams)).toEqual({
      query: "tècnic",
      view: "list",
      page: 2,
      filters: fullFilters,
    });
  });
});

describe("buildFilterFormKey", () => {
  it("cambia si cambia cualquier filtro", () => {
    const filters = parse({}).filters;
    expect(buildFilterFormKey("", 1, filters)).toBe(
      buildFilterFormKey("", 1, { ...filters }),
    );
    expect(buildFilterFormKey("", 1, filters)).not.toBe(
      buildFilterFormKey("", 1, { ...filters, reservedYoung: true }),
    );
  });
});

describe("buildMapMarkers", () => {
  const point = {
    municipality: "Terrassa",
    province: "Barcelona",
    latitude: 41.56,
    longitude: 2.01,
    count: 4,
  };

  it("marca el municipio seleccionado sin distinguir mayúsculas", () => {
    const filters = parse({ municipality: "TERRASSA", province: "barcelona" })
      .filters;
    expect(buildMapMarkers([point], "", filters)[0].selected).toBe(true);
    expect(
      buildMapMarkers([{ ...point, province: "Girona" }], "", filters)[0]
        .selected,
    ).toBe(false);
  });

  it("enlaza al listado del municipio limpiando comarca y radio", () => {
    const filters = parse({
      q: "auxiliar",
      view: "map",
      county: "Vallès Occidental",
      municipality: "Sabadell",
      radiusKm: "25",
      page: "4",
    }).filters;
    const params = new URLSearchParams(
      buildMapMarkers([point], "auxiliar", filters)[0].href.split("?")[1],
    );

    expect(params.get("view")).toBeNull();
    expect(params.get("q")).toBe("auxiliar");
    expect(params.get("municipality")).toBe("Terrassa");
    expect(params.get("province")).toBe("Barcelona");
    expect(params.get("county")).toBeNull();
    expect(params.get("radiusKm")).toBeNull();
    expect(params.get("page")).toBe("1");
  });
});

describe("getActiveFilterChips", () => {
  const filterOptions = {
    statuses,
    scopes: [{ id: 7, name: "Local" }],
    selectionSystems: [{ id: 8, name: "Concurs-oposició" }],
    personnelTypes: [{ id: 9, name: "Funcionari" }],
  };

  function removeParams(chips: ReturnType<typeof getActiveFilterChips>, key: string) {
    const chip = chips.find((item) => item.key === key);
    return new URLSearchParams(chip?.removeHref.split("?")[1]);
  }

  it("sin parámetros solo muestra los estados por defecto", () => {
    const { query, filters } = parse({});
    expect(
      getActiveFilterChips(query, filters, filterOptions, "list").map((chip) => chip.label),
    ).toEqual(["Pendent de termini", "Termini obert"]);
  });

  it("crea un chip por filtro con etiquetas legibles", () => {
    const { query, filters } = parse({
      q: "auxiliar",
      isJobPool: "true",
      statusFilterApplied: "1",
      applicationPeriod: "open",
      province: "Barcelona",
      municipality: "Sabadell",
      radiusKm: "25",
      qualificationGroup: "A1",
      scopeId: "7",
      selectionSystemId: "8",
      personnelTypeId: "9",
      applicationEndDateFrom: "2026-11-01",
      reservedYoung: "true",
    });

    expect(
      getActiveFilterChips(query, filters, filterOptions, "list").map((chip) => chip.label),
    ).toEqual([
      "«auxiliar»",
      "Bolsa de trabajo",
      "Plazo: Abierto ahora",
      "Barcelona",
      "Sabadell",
      "Hasta 25 km",
      "Grupo A1",
      "Local",
      "Concurs-oposició",
      "Funcionari",
      "Fin del plazo desde 01/11/2026",
      "Reserva: Jóvenes",
    ]);
  });

  it("quitar un filtro conserva el resto, la vista y vuelve a la página 1", () => {
    const { query, filters } = parse({
      q: "auxiliar",
      qualificationGroup: ["A1", "C1"],
      page: "3",
    });
    const params = removeParams(
      getActiveFilterChips(query, filters, filterOptions, "map"),
      "qualificationGroup-A1",
    );

    expect(params.getAll("qualificationGroup")).toEqual(["C1"]);
    expect(params.get("q")).toBe("auxiliar");
    expect(params.get("view")).toBe("map");
    expect(params.get("page")).toBe("1");
  });

  it("quitar el texto mantiene los filtros", () => {
    const { query, filters } = parse({ q: "auxiliar", qualificationGroup: "A1" });
    const params = removeParams(getActiveFilterChips(query, filters, filterOptions, "list"), "q");

    expect(params.get("q")).toBeNull();
    expect(params.get("qualificationGroup")).toBe("A1");
  });

  it("quitar un territorio quita también los que dependen de él", () => {
    const { query, filters } = parse({
      province: "Barcelona",
      county: "Vallès Occidental",
      municipality: "Sabadell",
      radiusKm: "25",
    });
    const chips = getActiveFilterChips(query, filters, filterOptions, "list");

    const withoutProvince = removeParams(chips, "province");
    expect(withoutProvince.get("province")).toBeNull();
    expect(withoutProvince.get("county")).toBeNull();
    expect(withoutProvince.get("municipality")).toBeNull();
    expect(withoutProvince.get("radiusKm")).toBeNull();

    const withoutMunicipality = removeParams(chips, "municipality");
    expect(withoutMunicipality.get("province")).toBe("Barcelona");
    expect(withoutMunicipality.get("county")).toBe("Vallès Occidental");
    expect(withoutMunicipality.get("radiusKm")).toBeNull();
  });

  it("quitar el último estado deja la búsqueda sin filtro de estado", () => {
    const { query, filters } = parse({ statusId: "3" });
    const params = removeParams(
      getActiveFilterChips(query, filters, filterOptions, "list"),
      "statusId-3",
    );

    expect(params.get("statusFilterApplied")).toBe("1");
    expect(params.getAll("statusId")).toEqual([]);
  });
});

describe("countAdvancedActiveFilters", () => {
  it("cuenta solo los filtros del bloque «Más filtros»", () => {
    expect(
      countAdvancedActiveFilters(
        parse({ qualificationGroup: "A1", applicationEndDateTo: "2026-12-31" }).filters,
      ),
    ).toBe(0);
    expect(
      countAdvancedActiveFilters(
        parse({
          scopeId: "7",
          applicationPeriod: "open",
          reservedWomen: "true",
        }).filters,
      ),
    ).toBe(3);
  });
});
