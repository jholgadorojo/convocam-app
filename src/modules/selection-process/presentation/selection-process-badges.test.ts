import { describe, expect, it } from "vitest";

import {
  buildApplicationPeriodBadgeText,
  hasReservedPlaces,
} from "./selection-process-badges";

describe("hasReservedPlaces", () => {
  const none = {
    disability: null,
    unemployed: false,
    youngPeople: false,
    women: false,
  };

  it("no hay reservas si todo está vacío o la discapacidad es 0", () => {
    expect(hasReservedPlaces(none)).toBe(false);
    expect(hasReservedPlaces({ ...none, disability: 0 })).toBe(false);
  });

  it.each([
    ["discapacidad", { disability: 2 }],
    ["personas desempleadas", { unemployed: true }],
    ["jóvenes", { youngPeople: true }],
    ["mujeres", { women: true }],
  ])("detecta la reserva para %s", (_, reservation) => {
    expect(hasReservedPlaces({ ...none, ...reservation })).toBe(true);
  });
});

describe("buildApplicationPeriodBadgeText", () => {
  it("añade el detalle si el plazo está abierto", () => {
    expect(
      buildApplicationPeriodBadgeText({
        state: "open",
        label: "Plazo abierto",
        detail: "Quedan 5 días",
      }),
    ).toBe("Plazo abierto · Quedan 5 días");
  });

  it("añade el detalle si el plazo aún no ha empezado", () => {
    expect(
      buildApplicationPeriodBadgeText({
        state: "future",
        label: "Próximamente",
        detail: "Empieza mañana",
      }),
    ).toBe("Próximamente · Empieza mañana");
  });

  it("muestra solo la etiqueta el último día", () => {
    expect(
      buildApplicationPeriodBadgeText({
        state: "open",
        label: "Finaliza hoy",
        detail: "Último día para presentar la solicitud",
      }),
    ).toBe("Finaliza hoy");
  });

  it.each(["closed", "unknown"] as const)(
    "muestra solo la etiqueta si el plazo es %s",
    (state) => {
      expect(
        buildApplicationPeriodBadgeText({
          state,
          label: "Plazo finalizado",
          detail: "Finalizó el 01/11/2026",
        }),
      ).toBe("Plazo finalizado");
    },
  );
});
