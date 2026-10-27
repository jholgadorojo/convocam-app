import {
  describe,
  expect,
  it,
} from "vitest";

import { parseSearchTerms } from "./search-terms";

describe(
  "parseSearchTerms",
  () => {
    it(
      "separa el texto en términos e ignora espacios sobrantes",
      () => {
        expect(parseSearchTerms("  auxiliar   administratiu ")).toEqual([
          "auxiliar",
          "administratiu",
        ]);
      },
    );

    it(
      "devuelve una lista vacía si no hay texto",
      () => {
        expect(parseSearchTerms("   ")).toEqual([]);
      },
    );

    it(
      "elimina términos repetidos",
      () => {
        expect(parseSearchTerms("tècnic tècnic tècnic")).toEqual(["tècnic"]);
      },
    );

    it(
      "limita el número de términos a 8",
      () => {
        const text = Array.from(
          { length: 200 },
          (_, index) => `abc${index}`,
        ).join(" ");

        expect(parseSearchTerms(text)).toHaveLength(8);
      },
    );

    it(
      "limita la longitud total del texto a 100 caracteres",
      () => {
        const terms = parseSearchTerms("a".repeat(5000));

        expect(terms).toEqual(["a".repeat(100)]);
      },
    );
  },
);
