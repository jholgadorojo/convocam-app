import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { SelectionProcessRepository } from "./selection-process-repository";
import type { SelectionProcessSource } from "./selection-process-source";

import { ReconcileMissingSelectionProcesses } from "./reconcile-missing-selection-processes";

describe("ReconcileMissingSelectionProcesses", () => {
  it("marks a selection process as inactive when the source no longer finds it", async () => {
    const markSourceInactive =
      vi.fn(async () => {});

    const repository = {
      upsert: vi.fn(async () => 1),

      findActiveNotSeenSince:
        vi.fn(async (_date: Date) => [
          {
            id: 1,
            cidoId: "123",
            institutionId: 10,
          },
        ]),

      markSourceInactive,
    } satisfies SelectionProcessRepository;

    const source = {
      getPage: vi.fn(async () => ({
        total: 0,
        items: [],
        rejected: [],
      })),

      getByCidoId:
        vi.fn(async () => null),
    } satisfies SelectionProcessSource;

    const useCase =
      new ReconcileMissingSelectionProcesses(
        source,
        repository,
      );

    const result = await useCase.execute(
      new Date(),
    );

    expect(
      markSourceInactive,
    ).toHaveBeenCalledWith("123");

    expect(result.deactivated).toBe(1);
    expect(result.checked).toBe(1);
  });

  it("does not mark a selection process as inactive when CIDO returns an error", async () => {
    const markSourceInactive =
      vi.fn(async () => {});

    const repository = {
      upsert: vi.fn(async () => 1),

      findActiveNotSeenSince:
        vi.fn(async (_date: Date) => [
          {
            id: 1,
            cidoId: "123",
            institutionId: 10,
          },
        ]),

      markSourceInactive,
    } satisfies SelectionProcessRepository;

    const source = {
      getPage: vi.fn(async () => ({
        total: 0,
        items: [],
        rejected: [],
      })),

      getByCidoId:
        vi.fn(async () => {
          throw new Error("CIDO unavailable");
        }),
    } satisfies SelectionProcessSource;

    const useCase =
      new ReconcileMissingSelectionProcesses(
        source,
        repository,
      );

    const result = await useCase.execute(
      new Date(),
    );

    expect(
      markSourceInactive,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      checked: 1,
      updated: 0,
      deactivated: 0,
      failed: 1,
      failures: [
        {
          cidoId: "123",
          message: "CIDO unavailable",
        },
      ],
    });
  });

  it("continues with the remaining selection processes when one fails", async () => {
    const markSourceInactive =
      vi.fn(async () => {});

    const repository = {
      upsert: vi.fn(async () => 1),

      findActiveNotSeenSince:
        vi.fn(async (_date: Date) => [
          {
            id: 1,
            cidoId: "123",
            institutionId: 10,
          },
          {
            id: 2,
            cidoId: "456",
            institutionId: 10,
          },
        ]),

      markSourceInactive,
    } satisfies SelectionProcessRepository;

    const source = {
      getPage: vi.fn(async () => ({
        total: 0,
        items: [],
        rejected: [],
      })),

      getByCidoId:
        vi.fn(async (cidoId: string) => {
          if (cidoId === "123") {
            throw new Error("CIDO unavailable");
          }

          return null;
        }),
    } satisfies SelectionProcessSource;

    const useCase =
      new ReconcileMissingSelectionProcesses(
        source,
        repository,
      );

    const result = await useCase.execute(
      new Date(),
    );

    expect(
      markSourceInactive,
    ).toHaveBeenCalledTimes(1);

    expect(
      markSourceInactive,
    ).toHaveBeenCalledWith("456");

    expect(result.checked).toBe(2);
    expect(result.deactivated).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.failures).toEqual([
      {
        cidoId: "123",
        message: "CIDO unavailable",
      },
    ]);
  });
});