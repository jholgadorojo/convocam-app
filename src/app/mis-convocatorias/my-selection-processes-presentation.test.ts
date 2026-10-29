import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserSelectionProcessListItem } from
  "@/modules/user-selection-process/application/user-selection-process-list-item";
import { PersonalSelectionProcessStatus } from
  "@/modules/user-selection-process/domain/personal-selection-process-status";
import {
  applyFilters,
  buildApplicationSummary,
  buildLocationText,
  formatCataloniaDate,
  getActiveFilterLabels,
  getEmptyListMessage,
  getRemoveDeadlineFilterLabel,
  hasActiveFilters,
  myProcessesHref,
  parseFilters,
  type MySelectionProcessesFilters,
} from "./my-selection-processes-presentation";

const { INTERESTED, PREPARING_APPLICATION, APPLICATION_SUBMITTED } =
  PersonalSelectionProcessStatus;

// getApplicationPeriodPresentation calcula «hoy» con la hora del sistema.
const today = date("2026-11-10");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-10T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

const noFilters: MySelectionProcessesFilters = {
  deadlineFilter: null,
  municipality: null,
  province: null,
  statuses: [],
};

function item(
  id: number,
  overrides: {
    personalStatus?: PersonalSelectionProcessStatus;
    applicationStartDate?: Date | null;
    applicationEndDate?: Date | null;
    municipality?: string | null;
    province?: string | null;
  } = {},
): UserSelectionProcessListItem {
  return {
    id,
    personalStatus: overrides.personalStatus ?? INTERESTED,
    followedAt: date("2026-10-01"),
    personalStatusUpdatedAt: date("2026-10-01"),
    selectionProcess: {
      id,
      cidoIdentifier: `CIDO-${id}`,
      title: `Convocatoria ${id}`,
      isJobPool: false,
      statusId: 3,
      status: "En curs",
      applicationStartDate: overrides.applicationStartDate ?? null,
      applicationEndDate: overrides.applicationEndDate ?? null,
      qualificationGroup: null,
      numberOfPositions: 1,
      personnelType: null,
      selectionSystem: null,
      scope: null,
      reservedPlaces: {
        disability: null,
        unemployed: false,
        youngPeople: false,
        women: false,
      },
      sourceActive: true,
      cidoUrl: `https://cido.diba.cat/${id}`,
      institution: {
        name: "Ajuntament",
        municipality:
          "municipality" in overrides ? overrides.municipality ?? null : "Terrassa",
        county: "Vallès Occidental",
        province: overrides.province ?? "Barcelona",
        latitude: null,
        longitude: null,
      },
      latestDocument: null,
    },
  };
}

function ids(items: UserSelectionProcessListItem[]): number[] {
  return items.map((listItem) => listItem.id);
}

describe("parseFilters", () => {
  it("sin parámetros no hay filtros", () => {
    expect(parseFilters({})).toEqual(noFilters);
  });

  it("aplica un solo filtro de plazo: caducadas > próximos > en plazo", () => {
    expect(
      parseFilters({
        expiredDeadlines: "1",
        upcomingDeadlines: "1",
        openApplications: "1",
      }).deadlineFilter,
    ).toBe("expired");
    expect(
      parseFilters({ upcomingDeadlines: "1", openApplications: "1" })
        .deadlineFilter,
    ).toBe("upcoming");
    expect(parseFilters({ openApplications: "1" }).deadlineFilter).toBe("open");
  });

  it("recorta el municipio e ignora la provincia sin municipio", () => {
    expect(
      parseFilters({ municipality: "  Terrassa ", province: " Barcelona " }),
    ).toMatchObject({ municipality: "Terrassa", province: "Barcelona" });
    expect(parseFilters({ municipality: "  ", province: "Barcelona" }))
      .toMatchObject({ municipality: null, province: null });
  });

  it("acepta solo estados válidos, en el orden del selector", () => {
    expect(
      parseFilters({
        personalStatus: [APPLICATION_SUBMITTED, "INVENTADO", INTERESTED],
      }).statuses,
    ).toEqual([INTERESTED, APPLICATION_SUBMITTED]);
    expect(parseFilters({ personalStatus: APPLICATION_SUBMITTED }).statuses).toEqual([
      APPLICATION_SUBMITTED,
    ]);
  });
});

describe("hasActiveFilters", () => {
  it("detecta cualquier filtro", () => {
    expect(hasActiveFilters(noFilters)).toBe(false);
    expect(hasActiveFilters({ ...noFilters, deadlineFilter: "open" })).toBe(true);
    expect(hasActiveFilters({ ...noFilters, municipality: "Terrassa" })).toBe(
      true,
    );
    expect(hasActiveFilters({ ...noFilters, statuses: [APPLICATION_SUBMITTED] })).toBe(true);
  });
});

describe("myProcessesHref", () => {
  it("sin filtros enlaza a la página base", () => {
    expect(myProcessesHref(noFilters)).toBe("/mis-convocatorias");
  });

  it("conserva todos los filtros", () => {
    expect(
      myProcessesHref({
        deadlineFilter: "upcoming",
        municipality: "Sant Cugat",
        province: "Barcelona",
        statuses: [INTERESTED, APPLICATION_SUBMITTED],
      }),
    ).toBe(
      "/mis-convocatorias?upcomingDeadlines=1&municipality=Sant+Cugat" +
        "&province=Barcelona&personalStatus=INTERESTED&personalStatus=APPLICATION_SUBMITTED",
    );
  });

  it("vuelve a leer los mismos filtros que genera", () => {
    const filters: MySelectionProcessesFilters = {
      deadlineFilter: "expired",
      municipality: "Terrassa",
      province: null,
      statuses: [PREPARING_APPLICATION],
    };
    const query = new URLSearchParams(myProcessesHref(filters).split("?")[1]);
    expect(
      parseFilters({
        expiredDeadlines: query.get("expiredDeadlines") ?? undefined,
        municipality: query.get("municipality") ?? undefined,
        personalStatus: query.getAll("personalStatus"),
      }),
    ).toEqual(filters);
  });
});

describe("applyFilters", () => {
  const openInTerrassa = item(1, {
    applicationStartDate: date("2026-11-01"),
    applicationEndDate: date("2026-11-20"),
  });
  const upcomingInSabadell = item(2, {
    personalStatus: PREPARING_APPLICATION,
    applicationStartDate: date("2026-11-01"),
    applicationEndDate: date("2026-11-12"),
    municipality: "Sabadell",
  });
  const expiredLongAgo = item(3, { applicationEndDate: date("2026-09-30") });
  const expiredRecently = item(4, { applicationEndDate: date("2026-11-09") });
  const appliedAndExpired = item(5, {
    personalStatus: APPLICATION_SUBMITTED,
    applicationEndDate: date("2026-11-01"),
  });
  const items = [
    openInTerrassa,
    upcomingInSabadell,
    expiredLongAgo,
    expiredRecently,
    appliedAndExpired,
  ];

  it("cuenta siempre sobre todos los seguimientos", () => {
    const result = applyFilters(
      items,
      { ...noFilters, municipality: "Sabadell", deadlineFilter: "open" },
      today,
    );
    expect(result.counts).toEqual({ all: 5, open: 2, expired: 2 });
  });

  it("sin filtros muestra todo", () => {
    const result = applyFilters(items, noFilters, today);
    expect(ids(result.listedItems)).toEqual([1, 2, 3, 4, 5]);
  });

  it("en plazo incluye cualquier estado personal", () => {
    const result = applyFilters(
      [...items, item(6, {
        personalStatus: APPLICATION_SUBMITTED,
        applicationStartDate: date("2026-11-01"),
        applicationEndDate: date("2026-11-30"),
      })],
      { ...noFilters, deadlineFilter: "open" },
      today,
    );
    expect(ids(result.listedItems)).toEqual([1, 2, 6]);
  });

  it("caducadas: solo pendientes de solicitar, las más recientes primero", () => {
    const result = applyFilters(
      items,
      { ...noFilters, deadlineFilter: "expired" },
      today,
    );
    expect(ids(result.listedItems)).toEqual([4, 3]);
  });

  it("plazos próximos: de hoy a 15 días, los más urgentes primero", () => {
    const result = applyFilters(
      [
        ...items,
        item(7, { applicationEndDate: date("2026-11-25") }),
        item(8, { applicationEndDate: date("2026-11-26") }),
        item(9, { applicationEndDate: date("2026-11-10") }),
      ],
      { ...noFilters, deadlineFilter: "upcoming" },
      today,
    );
    expect(ids(result.listedItems)).toEqual([9, 2, 1, 7]);
  });

  it("el municipio no limita el mapa y los estados no limitan los indicadores", () => {
    const result = applyFilters(
      items,
      { ...noFilters, municipality: "terrassa", province: "BARCELONA", statuses: [INTERESTED] },
      today,
    );
    expect(ids(result.itemsForStatusIndicators)).toEqual([1, 3, 4, 5]);
    expect(ids(result.itemsForMap)).toEqual([1, 3, 4]);
    expect(ids(result.listedItems)).toEqual([1, 3, 4]);
  });

  it("excluye del municipio las convocatorias de otra provincia o sin municipio", () => {
    const result = applyFilters(
      [
        openInTerrassa,
        item(10, { province: "Girona" }),
        item(11, { municipality: null }),
      ],
      { ...noFilters, municipality: "Terrassa", province: "Barcelona" },
      today,
    );
    expect(ids(result.listedItems)).toEqual([1]);
  });
});

describe("textos de los filtros", () => {
  it("describe los filtros activos en orden", () => {
    expect(
      getActiveFilterLabels({
        deadlineFilter: "open",
        municipality: "Terrassa",
        province: "Barcelona",
        statuses: [INTERESTED],
      }),
    ).toEqual([
      "Municipio: Terrassa · Barcelona",
      "En plazo (solicitudes abiertas hoy)",
      "1 estado seleccionado",
    ]);
  });

  it("tiene un texto para quitar cada filtro de plazo", () => {
    expect(getRemoveDeadlineFilterLabel("expired")).toBe(
      "Quitar filtro de caducadas",
    );
    expect(getRemoveDeadlineFilterLabel("open")).toBe(
      "Quitar filtro de plazo abierto",
    );
    expect(getRemoveDeadlineFilterLabel("upcoming")).toBe(
      "Quitar filtro de plazos",
    );
  });

  it("adapta el mensaje de lista vacía al filtro de plazo", () => {
    expect(getEmptyListMessage(null)).toBe(
      "No hay convocatorias que coincidan con los filtros seleccionados.",
    );
    expect(getEmptyListMessage("upcoming")).toContain("próximos 15 días");
  });
});

describe("buildApplicationSummary", () => {
  it.each([
    [date("2026-11-10"), "El plazo para presentar la solicitud finaliza hoy."],
    [date("2026-11-11"), "Queda 1 día para presentar la solicitud."],
    [date("2026-11-15"), "Quedan 5 días para presentar la solicitud."],
  ])("con el plazo abierto hasta %s", (endDate, expected) => {
    expect(
      buildApplicationSummary({ state: "open" }, null, endDate, today),
    ).toBe(expected);
  });

  it("indica cuándo empieza un plazo futuro", () => {
    expect(
      buildApplicationSummary({ state: "future" }, date("2026-11-11"), null, today),
    ).toBe("El plazo de solicitud comienza mañana.");
    expect(
      buildApplicationSummary({ state: "future" }, date("2026-11-14"), null, today),
    ).toBe("El plazo de solicitud comienza en 4 días.");
  });

  it("indica el plazo finalizado o sin fechas", () => {
    expect(buildApplicationSummary({ state: "closed" }, null, null, today)).toBe(
      "El plazo para presentar la solicitud ha finalizado.",
    );
    expect(buildApplicationSummary({ state: "unknown" }, null, null, today))
      .toBe("No hay fechas de solicitud disponibles.");
  });
});

describe("buildLocationText", () => {
  it("une municipio y comarca", () => {
    expect(
      buildLocationText({ municipality: "Terrassa", county: "Vallès Occidental" }),
    ).toBe("Terrassa · Vallès Occidental");
  });

  it("indica que no hay ubicación", () => {
    expect(buildLocationText(null)).toBe("Ubicación no disponible");
    expect(buildLocationText({ municipality: null, county: null })).toBe(
      "Ubicación no disponible",
    );
  });
});

describe("formatCataloniaDate", () => {
  it("usa el día de Catalunya, no el de UTC", () => {
    // 23:30 UTC del 9 de noviembre = 00:30 del 10 en Catalunya.
    expect(formatCataloniaDate(new Date("2026-11-09T23:30:00.000Z"))).toBe(
      "10/11/2026",
    );
  });
});
