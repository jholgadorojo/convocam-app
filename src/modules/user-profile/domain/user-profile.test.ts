import { describe, expect, it } from "vitest";

import { UserProfile } from "./user-profile";

describe("UserProfile", () => {
  it("creates a valid user profile", () => {
    const profile = UserProfile.create({
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    expect(profile.id).toBeUndefined();
    expect(profile.userId).toBe("user-123");
    expect(profile.firstName).toBe("Jose");
    expect(profile.lastName).toBe("Holgado");
  });

  it("does not allow an empty user id", () => {
    expect(() =>
      UserProfile.create({
        userId: "",
        firstName: "Jose",
        lastName: "Holgado",
      }),
    ).toThrow("User id is required");
  });

  it("does not allow an empty first name", () => {
    expect(() =>
      UserProfile.create({
        userId: "user-123",
        firstName: "",
        lastName: "Holgado",
      }),
    ).toThrow("First name is required");
  });

  it("does not allow an empty last name", () => {
    expect(() =>
      UserProfile.create({
        userId: "user-123",
        firstName: "Jose",
        lastName: "",
      }),
    ).toThrow("Last name is required");
  });

  it("removes spaces from first name and last name", () => {
    const profile = UserProfile.create({
      userId: "user-123",
      firstName: "  Jose  ",
      lastName: "  Holgado  ",
    });

    expect(profile.firstName).toBe("Jose");
    expect(profile.lastName).toBe("Holgado");
  });

  it("restores an existing user profile", () => {
    const profile = UserProfile.restore({
      id: 1,
      userId: "user-123",
      firstName: "Jose",
      lastName: "Holgado",
    });

    expect(profile.id).toBe(1);
    expect(profile.userId).toBe("user-123");
    expect(profile.firstName).toBe("Jose");
    expect(profile.lastName).toBe("Holgado");
  });

  it("does not restore a profile with an invalid id", () => {
    expect(() =>
      UserProfile.restore({
        id: 0,
        userId: "user-123",
        firstName: "Jose",
        lastName: "Holgado",
      }),
    ).toThrow("Valid id is required");
  });
});