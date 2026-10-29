import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getApplicationPeriodPresentation,
  getOfficialStatusPresentation,
} from "./selection-process-status";

const today = date("2026-11-10");

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function period(start: string | null, end: string | null) {
  return getApplicationPeriodPresentation(
    start ? date(start) : null,
    end ? date(end) : null,
    today,
  );
}

describe("getApplicationPeriodPresentation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sin fechas, el plazo no está disponible", () => {
    expect(getApplicationPeriodPresentation(null, undefined, today)).toMatchObject({
      state: "unknown",
      label: "Plazo no disponible",
      detail: "Sin información de fechas",
      remainingDays: null,
      progress: 0,
    });
  });

  it("ignora las fechas no válidas", () => {
    expect(
      getApplicationPeriodPresentation(new Date("no-es-fecha"), null, today)
        .state,
    ).toBe("unknown");
  });

  describe("antes del inicio", () => {
    it("indica que empieza mañana", () => {
      expect(period("2026-11-11", "2026-11-30")).toMatchObject({
        state: "future",
        label: "Próximamente",
        detail: "Empieza mañana",
        remainingDays: null,
        progress: 0,
      });
    });

    it("indica en cuántos días empieza", () => {
      expect(period("2026-11-15", null).detail).toBe("Empieza en 5 días");
    });
  });

  describe("con el plazo abierto", () => {
    it("muestra los días restantes y el avance del plazo", () => {
      // 9 de 19 días transcurridos.
      expect(period("2026-11-01", "2026-11-20")).toMatchObject({
        state: "open",
        label: "Plazo abierto",
        detail: "Quedan 10 días",
        remainingDays: 10,
        progress: 47,
      });
    });

    it("usa el verde si quedan más de 3 días", () => {
      expect(period("2026-11-01", "2026-11-14").badgeClassName).toContain(
        "#1B7A4B",
      );
    });

    it("avisa en ámbar si quedan 3 días o menos", () => {
      const threeDays = period("2026-11-01", "2026-11-13");
      expect(threeDays.detail).toBe("Quedan 3 días");
      expect(threeDays.badgeClassName).toContain("#9A6700");
    });

    it("indica que finaliza mañana", () => {
      expect(period("2026-11-01", "2026-11-11")).toMatchObject({
        detail: "Finaliza mañana",
        remainingDays: 1,
      });
    });

    it("destaca en rojo el último día", () => {
      const lastDay = period("2026-11-01", "2026-11-10");
      expect(lastDay).toMatchObject({
        state: "open",
        label: "Finaliza hoy",
        detail: "Último día para presentar la solicitud",
        remainingDays: 0,
        progress: 100,
      });
      expect(lastDay.badgeClassName).toContain("#B42318");
    });

    it("sin fecha de inicio no calcula el avance", () => {
      expect(period(null, "2026-11-20")).toMatchObject({
        state: "open",
        remainingDays: 10,
        progress: 0,
      });
    });

    it("sin fecha final, el plazo está iniciado", () => {
      expect(period("2026-11-01", null)).toMatchObject({
        state: "open",
        label: "Plazo iniciado",
        detail: "Sin fecha de finalización",
        remainingDays: null,
      });
    });
  });

  it("después del fin, el plazo ha finalizado", () => {
    expect(period("2026-10-01", "2026-11-09")).toMatchObject({
      state: "closed",
      label: "Plazo finalizado",
      detail: "Finalizó el 09/11/2026",
      remainingDays: 0,
      progress: 100,
    });
  });

  it("por defecto usa el día actual de Catalunya", () => {
    vi.useFakeTimers();
    // 23:30 UTC del 9 de noviembre = 00:30 del 10 en Catalunya.
    vi.setSystemTime(new Date("2026-11-09T23:30:00.000Z"));

    expect(
      getApplicationPeriodPresentation(date("2026-11-01"), date("2026-11-10"))
        .label,
    ).toBe("Finaliza hoy");
  });
});

describe("getOfficialStatusPresentation", () => {
  it.each([
    ["Anul·lat", "red"],
    ["Suspesa", "red"],
    ["Finalitzat", "gray"],
    ["Procés resolt", "gray"],
    ["Termini obert", "green"],
    ["Plazo abierto", "green"],
    ["Pendent de termini", "blue"],
    ["En curs", "amber"],
    ["Llista provisional d'admesos", "amber"],
  ])("«%s» se muestra en %s", (status, tone) => {
    expect(getOfficialStatusPresentation(status).tone).toBe(tone);
  });

  it("no distingue mayúsculas, tildes ni espacios", () => {
    expect(getOfficialStatusPresentation("  TERMINI   OBERT ").tone).toBe(
      "green",
    );
    expect(getOfficialStatusPresentation("Plazo ABIERTO").tone).toBe("green");
  });

  it("la anulación tiene prioridad sobre el resto", () => {
    expect(getOfficialStatusPresentation("Finalitzat per anul·lació").tone)
      .toBe("red");
  });

  it("conserva el texto original como etiqueta", () => {
    expect(getOfficialStatusPresentation("Termini obert").label).toBe(
      "Termini obert",
    );
  });

  it.each([
    [1, "green"],
    [2, "blue"],
    [3, "amber"],
  ])("si el texto no se reconoce, usa el id %i (%s)", (statusId, tone) => {
    expect(getOfficialStatusPresentation("Desconegut", statusId).tone).toBe(
      tone,
    );
  });

  it("un estado desconocido sin id se muestra en gris", () => {
    expect(getOfficialStatusPresentation("Desconegut").tone).toBe("gray");
    expect(getOfficialStatusPresentation("Desconegut", 99).tone).toBe("gray");
  });
});
