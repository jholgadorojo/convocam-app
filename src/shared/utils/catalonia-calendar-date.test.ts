import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getCataloniaCalendarDate,
  getCataloniaDayNumber,
} from "./catalonia-calendar-date";

describe(
  "getCataloniaCalendarDate",
  () => {
    it(
      "devuelve el día de Catalunya a las 00:00 UTC",
      () => {
        expect(
          getCataloniaCalendarDate(new Date("2026-10-18T09:30:00.000Z")),
        ).toEqual(new Date("2026-10-18T00:00:00.000Z"));
      },
    );

    it(
      "en horario de verano (UTC+2) ya es el día siguiente a las 22:00 UTC",
      () => {
        expect(
          getCataloniaCalendarDate(new Date("2026-07-14T21:59:59.000Z")),
        ).toEqual(new Date("2026-07-14T00:00:00.000Z"));
        expect(
          getCataloniaCalendarDate(new Date("2026-07-14T22:00:00.000Z")),
        ).toEqual(new Date("2026-07-15T00:00:00.000Z"));
      },
    );

    it(
      "en horario de invierno (UTC+1) ya es el día siguiente a las 23:00 UTC",
      () => {
        expect(
          getCataloniaCalendarDate(new Date("2026-01-20T22:59:59.000Z")),
        ).toEqual(new Date("2026-01-20T00:00:00.000Z"));
        expect(
          getCataloniaCalendarDate(new Date("2026-01-20T23:00:00.000Z")),
        ).toEqual(new Date("2026-01-21T00:00:00.000Z"));
      },
    );

    it(
      "respeta los días de cambio de hora",
      () => {
        // 29/03/2026: a las 01:00 UTC se pasa de UTC+1 a UTC+2.
        expect(
          getCataloniaCalendarDate(new Date("2026-03-28T23:00:00.000Z")),
        ).toEqual(new Date("2026-03-29T00:00:00.000Z"));
        expect(
          getCataloniaCalendarDate(new Date("2026-03-29T21:59:59.000Z")),
        ).toEqual(new Date("2026-03-29T00:00:00.000Z"));

        // 25/10/2026: a las 01:00 UTC se pasa de UTC+2 a UTC+1.
        expect(
          getCataloniaCalendarDate(new Date("2026-10-24T22:00:00.000Z")),
        ).toEqual(new Date("2026-10-25T00:00:00.000Z"));
        expect(
          getCataloniaCalendarDate(new Date("2026-10-25T22:59:59.000Z")),
        ).toEqual(new Date("2026-10-25T00:00:00.000Z"));
      },
    );

    it(
      "cambia de año según la hora de Catalunya",
      () => {
        expect(
          getCataloniaCalendarDate(new Date("2026-12-31T23:00:00.000Z")),
        ).toEqual(new Date("2027-01-01T00:00:00.000Z"));
      },
    );
  },
);

describe(
  "getCataloniaDayNumber",
  () => {
    it(
      "devuelve los días transcurridos desde el 01/01/1970",
      () => {
        expect(
          getCataloniaDayNumber(new Date("1970-01-02T12:00:00.000Z")),
        ).toBe(1);
        expect(
          getCataloniaDayNumber(new Date("2026-10-18T09:30:00.000Z")),
        ).toBe(
          Date.UTC(2026, 9, 18) / (24 * 60 * 60 * 1000),
        );
      },
    );
  },
);
