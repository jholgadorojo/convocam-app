import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import oposicionsPage from "./__fixtures__/oposicions-page.json";
import { getCidoSelectionProcesses } from "./cido-client";
import { CidoSelectionProcessSource } from "./cido-selection-process-source";

vi.mock("./cido-client", () => ({
  getCidoSelectionProcesses: vi.fn(),
  getCidoSelectionProcessById: vi.fn(),
}));

const [valid, invalid, ...rest] = oposicionsPage.data;

describe("CidoSelectionProcessSource", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("descarta las convocatorias mal formadas sin perder el resto de la página", async () => {
    vi.mocked(getCidoSelectionProcesses).mockResolvedValueOnce({
      meta: oposicionsPage.meta,
      data: [
        valid,
        {
          ...invalid,
          attributes: {
            ...invalid.attributes,
            dataFinalitzacio: "23/11/2026",
          },
        },
        { type: "oposicions" },
        ...rest,
      ],
    });

    const page = await new CidoSelectionProcessSource().getPage({
      limit: 5,
      offset: 0,
    });

    expect(page.total).toBe(oposicionsPage.meta.totalResourceCount);

    expect(page.items.map((item) => item.cidoId)).toEqual([
      valid.id,
      ...rest.map((item) => item.id),
    ]);

    expect(page.rejected).toEqual([
      {
        cidoId: invalid.id,
        message: expect.stringMatching(
          /^Convocatoria de CIDO no válida:[\s\S]*attributes\.dataFinalitzacio/,
        ),
      },
      {
        cidoId: "desconocido",
        message: expect.stringContaining(
          "Convocatoria de CIDO no válida",
        ),
      },
    ]);

    expect(getCidoSelectionProcesses).toHaveBeenCalledWith({
      limit: 5,
      offset: 0,
    });
  });
});
