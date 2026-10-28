
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Simulamos la sincronización para no modificar
// ningún dato real de PostgreSQL ni consultar CIDO.
const { syncExecute } = vi.hoisted(() => ({
  syncExecute: vi.fn(),
}));

vi.mock("@/composition/selection-process", () => ({
  runSelectionProcessSyncUseCase: {
    execute: syncExecute,
  },
}));

import { POST } from "./route";

// Token ficticio exclusivo para las pruebas.
const TEST_TOKEN = "a".repeat(64);
const INVALID_TOKEN = "b".repeat(64);

const originalToken = process.env.CIDO_INTERNAL_API_TOKEN;

function createRequest(
  authorization?: string,
): Request {
  return new Request(
    "http://localhost:3000/api/internal/cido/sync-all",
    {
      method: "POST",
      headers: authorization
        ? { Authorization: authorization }
        : {},
    },
  );
}

describe("Seguridad de sincronización CIDO", () => {
  beforeEach(() => {
    process.env.CIDO_INTERNAL_API_TOKEN = TEST_TOKEN;

    syncExecute.mockReset();
    syncExecute.mockResolvedValue({
      completed: true,
    });
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.CIDO_INTERNAL_API_TOKEN;
    } else {
      process.env.CIDO_INTERNAL_API_TOKEN =
        originalToken;
    }
  });

  it("rechaza peticiones sin token", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(syncExecute).not.toHaveBeenCalled();
  });

  it("rechaza tokens incorrectos", async () => {
    const response = await POST(
      createRequest(`Bearer ${INVALID_TOKEN}`),
    );

    expect(response.status).toBe(401);
    expect(syncExecute).not.toHaveBeenCalled();
  });

  it("rechaza cabeceras sin Bearer", async () => {
    const response = await POST(
      createRequest(`Basic ${TEST_TOKEN}`),
    );

    expect(response.status).toBe(401);
    expect(syncExecute).not.toHaveBeenCalled();
  });

  it("rechaza peticiones sin secreto configurado", async () => {
    delete process.env.CIDO_INTERNAL_API_TOKEN;

    const response = await POST(
      createRequest(`Bearer ${TEST_TOKEN}`),
    );

    expect(response.status).toBe(401);
    expect(syncExecute).not.toHaveBeenCalled();
  });

  it("rechaza secretos demasiado cortos", async () => {
    process.env.CIDO_INTERNAL_API_TOKEN = "123";

    const response = await POST(
      createRequest("Bearer 123"),
    );

    expect(response.status).toBe(401);
    expect(syncExecute).not.toHaveBeenCalled();
  });

  it("autoriza un token válido", async () => {
    const response = await POST(
      createRequest(`Bearer ${TEST_TOKEN}`),
    );

    expect(response.status).toBe(200);
    expect(syncExecute).toHaveBeenCalledTimes(1);

    const body = await response.json();

    expect(body.message).toBe(
      "Sincronización completa finalizada",
    );
  });

  it("responde 409 si ya hay una sincronización en curso", async () => {
    syncExecute.mockResolvedValue({
      completed: false,
      reason: "ALREADY_RUNNING",
    });

    const response = await POST(
      createRequest(`Bearer ${TEST_TOKEN}`),
    );

    expect(response.status).toBe(409);

    const body = await response.json();

    expect(body.error).toBe(
      "Ya hay una sincronización de CIDO en curso",
    );
  });
});
