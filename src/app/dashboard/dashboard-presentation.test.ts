import { describe, expect, it } from "vitest";

import {
  dashboardDetailHref,
  deadlineBadgeClasses,
  deadlineBadgeLabel,
  formatCalendarDate,
  getOpportunityDateText,
} from "./dashboard-presentation";

const startDate = new Date("2026-11-02T00:00:00.000Z");
const endDate = new Date("2026-11-20T00:00:00.000Z");

describe("formatCalendarDate", () => {
  it("formatea la fecha en dd/mm/aaaa sin desplazarla por la zona horaria", () => {
    expect(formatCalendarDate(new Date("2026-01-01T00:00:00.000Z"))).toBe(
      "01/01/2026",
    );
  });
});

describe("dashboardDetailHref", () => {
  it("enlaza al detalle con retorno al dashboard", () => {
    expect(dashboardDetailHref(42)).toBe(
      "/convocatorias/42?returnTo=%2Fdashboard",
    );
  });
});

describe("getOpportunityDateText", () => {
  it("muestra el fin del plazo cuando el plazo está abierto", () => {
    expect(
      getOpportunityDateText({
        statusId: 3,
        applicationStartDate: startDate,
        applicationEndDate: endDate,
      }),
    ).toBe("Fin del plazo: 20/11/2026");
  });

  it("indica que el fin está por confirmar si el plazo abierto no tiene fecha final", () => {
    expect(
      getOpportunityDateText({
        statusId: 3,
        applicationStartDate: startDate,
        applicationEndDate: null,
      }),
    ).toBe("Fin del plazo por confirmar");
  });

  it("muestra el inicio del plazo cuando está pendiente de plazo", () => {
    expect(
      getOpportunityDateText({
        statusId: 2,
        applicationStartDate: startDate,
        applicationEndDate: endDate,
      }),
    ).toBe("Inicio del plazo: 02/11/2026");
  });

  it("indica que el inicio está por confirmar si no tiene fecha de inicio", () => {
    expect(
      getOpportunityDateText({
        statusId: 2,
        applicationStartDate: null,
        applicationEndDate: endDate,
      }),
    ).toBe("Inicio del plazo por confirmar");
  });

  it("usa la fecha final en los demás estados", () => {
    expect(
      getOpportunityDateText({
        statusId: 1,
        applicationStartDate: null,
        applicationEndDate: endDate,
      }),
    ).toBe("Fin del plazo: 20/11/2026");

    expect(
      getOpportunityDateText({
        statusId: 1,
        applicationStartDate: null,
        applicationEndDate: null,
      }),
    ).toBe("Fechas por confirmar");
  });
});

describe("deadlineBadgeLabel", () => {
  it.each([
    [0, "Finaliza hoy"],
    [1, "Queda 1 día"],
    [2, "Quedan 2 días"],
    [15, "Quedan 15 días"],
  ])("con %i días restantes muestra «%s»", (daysRemaining, label) => {
    expect(deadlineBadgeLabel(daysRemaining)).toBe(label);
  });
});

describe("deadlineBadgeClasses", () => {
  it("destaca en rojo el último día, en ámbar hasta 3 días y en gris el resto", () => {
    expect(deadlineBadgeClasses(0)).toBe("bg-[#FDEDEC] text-[#B42318]");
    expect(deadlineBadgeClasses(1)).toBe("bg-[#FFF2DF] text-[#955000]");
    expect(deadlineBadgeClasses(3)).toBe("bg-[#FFF2DF] text-[#955000]");
    expect(deadlineBadgeClasses(4)).toBe("bg-[#F0F2F5] text-[#4E5870]");
  });
});
