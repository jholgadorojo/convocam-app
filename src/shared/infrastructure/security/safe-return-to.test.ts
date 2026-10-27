import {
  describe,
  expect,
  it,
} from "vitest";

import { getSafeReturnTo } from "./safe-return-to";

describe(
  "getSafeReturnTo",
  () => {
    it(
      "mantiene las rutas internas con su query string",
      () => {
        expect(getSafeReturnTo("/mi-perfil")).toBe("/mi-perfil");
        expect(
          getSafeReturnTo("/convocatorias?q=auxiliar&page=2"),
        ).toBe("/convocatorias?q=auxiliar&page=2");
        expect(getSafeReturnTo("/convocatorias/12")).toBe(
          "/convocatorias/12",
        );
      },
    );

    it(
      "usa el dashboard cuando no hay returnTo",
      () => {
        expect(getSafeReturnTo(null)).toBe("/dashboard");
        expect(getSafeReturnTo(undefined)).toBe("/dashboard");
        expect(getSafeReturnTo("")).toBe("/dashboard");
      },
    );

    it(
      "rechaza URLs absolutas y esquemas peligrosos",
      () => {
        expect(getSafeReturnTo("https://evil.com")).toBe("/dashboard");
        expect(getSafeReturnTo("javascript:alert(1)")).toBe(
          "/dashboard",
        );
        expect(getSafeReturnTo("mi-perfil")).toBe("/dashboard");
      },
    );

    it(
      "rechaza las variantes que el navegador convierte en dominio externo",
      () => {
        const attacks = [
          "//evil.com",
          "/\\evil.com",
          "/\\/evil.com",
          "/\t/evil.com",
          "/\n/evil.com",
          "///evil.com",
        ];

        for (const attack of attacks) {
          expect(getSafeReturnTo(attack)).toBe("/dashboard");
        }
      },
    );
  },
);
