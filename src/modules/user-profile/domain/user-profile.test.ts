import { describe, expect, it } from "vitest";

import { UserProfile } from "./user-profile";

describe("UserProfile", () => {
  it("does not allow an empty user id", () => {
  expect(() =>
    UserProfile.create({
      userId: "",
      firstName: "Jose",
      lastName: "Holgado",
    }),
  ).toThrow("El identificador del usuario es obligatorio");
});

it("does not allow an empty first name", () => {
  expect(() =>
    UserProfile.create({
      userId: "user-123",
      firstName: "",
      lastName: "Holgado",
    }),
  ).toThrow("El nombre es obligatorio");
});

it("does not allow an empty last name", () => {
  expect(() =>
    UserProfile.create({
      userId: "user-123",
      firstName: "Jose",
      lastName: "",
    }),
  ).toThrow("Los apellidos son obligatorios");
});

it("does not restore a profile with an invalid id", () => {
  expect(() =>
    UserProfile.restore({
      id: 0,
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    }),
  ).toThrow("El identificador del perfil no es válido");
});
});