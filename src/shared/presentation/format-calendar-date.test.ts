import { describe, expect, it } from "vitest";

import { formatCalendarDate } from "./format-calendar-date";

describe("formatCalendarDate", () => {
  it("formatea la fecha en dd/mm/aaaa sin desplazarla por la zona horaria", () => {
    expect(formatCalendarDate(new Date("2026-01-01T00:00:00.000Z"))).toBe(
      "01/01/2026",
    );
  });

  it("muestra el texto indicado cuando no hay fecha", () => {
    expect(formatCalendarDate(null, "No indicada")).toBe("No indicada");
  });

  it("ignora el texto alternativo cuando hay fecha", () => {
    expect(
      formatCalendarDate(
        new Date("2026-11-20T00:00:00.000Z"),
        "No indicada",
      ),
    ).toBe("20/11/2026");
  });
});
