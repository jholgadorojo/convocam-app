import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getCidoSelectionProcessById,
  getCidoSelectionProcesses,
} from "./cido-client";

const emptyPage = {
  data: [],
  meta: { totalResourceCount: 0 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function timeoutError(): DOMException {
  return new DOMException(
    "The operation was aborted due to timeout",
    "TimeoutError",
  );
}

describe(
  "cido-client",
  () => {
    beforeEach(() => {
      // Las esperas entre reintentos se simulan para no ralentizar los tests.
      vi.useFakeTimers();
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it(
      "envía las peticiones con un límite de tiempo",
      async () => {
        const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
        vi.stubGlobal("fetch", fetchMock);

        await getCidoSelectionProcesses({ limit: 1 });

        const [, init] = fetchMock.mock.calls[0] as unknown as [
          URL,
          RequestInit,
        ];

        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(init.cache).toBe("no-store");
      },
    );

    it(
      "hace una sola petición cuando CIDO responde bien",
      async () => {
        const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
        vi.stubGlobal("fetch", fetchMock);

        const result = await getCidoSelectionProcesses();

        expect(result).toEqual(emptyPage);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
      },
    );

    it(
      "falla con un error descriptivo si la respuesta no tiene el formato esperado",
      async () => {
        const fetchMock = vi.fn(async () =>
          jsonResponse({ data: [], meta: {} }),
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(getCidoSelectionProcesses()).rejects.toThrow(
          /Respuesta de CIDO no válida en \/dadesobertes\/cido\/v1\/oposicions:[\s\S]*totalResourceCount/,
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "reintenta tras un timeout y continúa si el siguiente intento funciona",
      async () => {
        const fetchMock = vi
          .fn()
          .mockRejectedValueOnce(timeoutError())
          .mockResolvedValueOnce(jsonResponse(emptyPage));
        vi.stubGlobal("fetch", fetchMock);

        const promise = getCidoSelectionProcesses();
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toEqual(emptyPage);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      },
    );

    it(
      "reintenta los errores 5xx y 429",
      async () => {
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(jsonResponse({}, 503))
          .mockResolvedValueOnce(jsonResponse({}, 429))
          .mockResolvedValueOnce(jsonResponse(emptyPage));
        vi.stubGlobal("fetch", fetchMock);

        const promise = getCidoSelectionProcesses();
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toEqual(emptyPage);
        expect(fetchMock).toHaveBeenCalledTimes(3);
      },
    );

    it(
      "no reintenta un 404 y mantiene la detección de convocatorias eliminadas",
      async () => {
        const fetchMock = vi.fn(async () => jsonResponse({}, 404));
        vi.stubGlobal("fetch", fetchMock);

        await expect(
          getCidoSelectionProcessById("12345"),
        ).resolves.toEqual({ data: null });
        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "falla con un error descriptivo si se agotan los reintentos por timeout",
      async () => {
        const fetchMock = vi.fn(async () => {
          throw timeoutError();
        });
        vi.stubGlobal("fetch", fetchMock);

        const promise = getCidoSelectionProcessById("12345");
        const assertion = expect(promise).rejects.toThrow(
          "CIDO no ha respondido en 30 s: /dadesobertes/cido/v1/oposicions/12345",
        );
        await vi.runAllTimersAsync();

        await assertion;
        expect(fetchMock).toHaveBeenCalledTimes(3);
      },
    );

    it(
      "devuelve el error HTTP si CIDO sigue fallando tras los reintentos",
      async () => {
        const fetchMock = vi.fn(async () => jsonResponse({}, 500));
        vi.stubGlobal("fetch", fetchMock);

        const promise = getCidoSelectionProcesses();
        const assertion = expect(promise).rejects.toThrow(
          "Error consultando CIDO: 500",
        );
        await vi.runAllTimersAsync();

        await assertion;
        expect(fetchMock).toHaveBeenCalledTimes(3);
      },
    );

    it(
      "propaga el error de red original si se agotan los reintentos",
      async () => {
        const fetchMock = vi.fn(async () => {
          throw new TypeError("fetch failed");
        });
        vi.stubGlobal("fetch", fetchMock);

        const promise = getCidoSelectionProcesses();
        const assertion = expect(promise).rejects.toThrow("fetch failed");
        await vi.runAllTimersAsync();

        await assertion;
        expect(fetchMock).toHaveBeenCalledTimes(3);
      },
    );
  },
);
