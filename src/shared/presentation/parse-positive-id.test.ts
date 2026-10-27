import {
  describe,
  expect,
  it,
} from "vitest";

import { isPositiveId, parsePositiveId } from "./parse-positive-id";

describe(
  "parsePositiveId",
  () => {
    it(
      "convierte identificadores válidos",
      () => {
        expect(parsePositiveId("1")).toBe(1);
        expect(parsePositiveId("1234")).toBe(1234);
        expect(parsePositiveId(" 42 ")).toBe(42);
        expect(parsePositiveId("2147483647")).toBe(2147483647);
      },
    );

    it(
      "rechaza valores fuera del rango de PostgreSQL",
      () => {
        expect(parsePositiveId("2147483648")).toBeNull();
        expect(parsePositiveId("99999999999")).toBeNull();
      },
    );

    it(
      "rechaza notación científica, decimales, signos y texto",
      () => {
        const invalidValues = [
          "1e20",
          "1e3",
          "1.5",
          "-1",
          "+1",
          "0",
          "0x10",
          "abc",
          "",
        ];

        for (const value of invalidValues) {
          expect(parsePositiveId(value)).toBeNull();
        }
      },
    );

    it(
      "rechaza valores que no son texto",
      () => {
        expect(parsePositiveId(null)).toBeNull();
        expect(parsePositiveId(undefined)).toBeNull();
        expect(parsePositiveId(12)).toBeNull();
      },
    );
  },
);

describe(
  "isPositiveId",
  () => {
    it(
      "acepta enteros positivos dentro del rango",
      () => {
        expect(isPositiveId(1)).toBe(true);
        expect(isPositiveId(2147483647)).toBe(true);
      },
    );

    it(
      "rechaza números fuera de rango o no enteros",
      () => {
        expect(isPositiveId(0)).toBe(false);
        expect(isPositiveId(2147483648)).toBe(false);
        expect(isPositiveId(1e20)).toBe(false);
        expect(isPositiveId(1.5)).toBe(false);
        expect(isPositiveId("1")).toBe(false);
      },
    );
  },
);
