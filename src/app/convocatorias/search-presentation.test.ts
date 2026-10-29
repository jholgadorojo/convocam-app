import { describe, expect, it } from "vitest";

import {
  buildFilterFormKey,
  buildMapMarkers,
  buildPageHref,
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
