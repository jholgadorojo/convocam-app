import {
  describe,
  expect,
  it,
} from "vitest";

import { getPasswordPolicyError } from "./password-policy";

describe(
  "getPasswordPolicyError",
  () => {
    it(
      "acepta contraseñas con al menos 8 caracteres, una letra y un número",
      () => {
        expect(getPasswordPolicyError("Abcdefg1")).toBeNull();
        expect(getPasswordPolicyError("oposicion2026")).toBeNull();
      },
    );

    it(
      "rechaza contraseñas cortas, sin número o sin letra",
      () => {
        const expected =
          "La contraseña debe tener al menos 8 caracteres, una letra y un número.";

        expect(getPasswordPolicyError("Abc1")).toBe(expected);
        expect(getPasswordPolicyError("aaaaaaaa")).toBe(expected);
        expect(getPasswordPolicyError("12345678")).toBe(expected);
      },
    );

    it(
      "rechaza contraseñas de más de 128 caracteres",
      () => {
        expect(
          getPasswordPolicyError(`a1${"x".repeat(127)}`),
        ).toBe("La contraseña no puede superar los 128 caracteres.");
      },
    );

    it(
      "rechaza valores que no son texto",
      () => {
        expect(getPasswordPolicyError(undefined)).toBe(
          "La contraseña no es válida.",
        );
        expect(getPasswordPolicyError(12345678)).toBe(
          "La contraseña no es válida.",
        );
      },
    );
  },
);
