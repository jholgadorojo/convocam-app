
import { describe, expect, it } from "vitest";

import { UserProfile } from "../../domain/user-profile";
import { InMemoryUserProfileRepository } from "../../adapters/repositories/in-memory-user-profile.repository";

import { ChangeUserProfilePersonalData } from "./change-user-profile-personal-data";

describe("ChangeUserProfilePersonalData", () => {
    function setup() {
        const repository = new InMemoryUserProfileRepository();

        const useCase = new ChangeUserProfilePersonalData(
            repository,
            {
                saveProfileAndUserName: (profile: UserProfile) =>
                    repository.save(profile),
            },
        );

        return {
            repository,
            useCase,
        };
    }

    const createProfile = () =>
        UserProfile.create({
            userId: "user-1",
            firstName: "Ana",
            lastName: "García",
        });

    it("crea el perfil si el usuario todavía no tiene uno", async () => {
        const { repository, useCase } = setup();

        const result = await useCase.execute({
            userId: "user-1",
            firstName: "Ana",
            lastName: "García",
        });

        expect(result.id).toBeDefined();
        expect(result.userId).toBe("user-1");
        expect(result.firstName).toBe("Ana");
        expect(result.lastName).toBe("García");

        const saved = await repository.findByUserId("user-1");

        expect(saved).not.toBeNull();
    });

    it("actualiza el nombre y los apellidos de un perfil existente", async () => {
        const { repository, useCase } = setup();

        const original = await repository.save(createProfile());

        const result = await useCase.execute({
            userId: "user-1",
            firstName: "María",
            lastName: "López",
        });

        expect(result.id).toBe(original.id);
        expect(result.firstName).toBe("María");
        expect(result.lastName).toBe("López");

        const saved = await repository.findByUserId("user-1");

        expect(saved?.firstName).toBe("María");
        expect(saved?.lastName).toBe("López");
    });

    it("elimina espacios adicionales del nombre y los apellidos", async () => {
        const { useCase } = setup();

        const result = await useCase.execute({
            userId: "user-1",
            firstName: "  Ana María  ",
            lastName: "  García López  ",
        });

        expect(result.firstName).toBe("Ana María");
        expect(result.lastName).toBe("García López");
    });

    it("conserva el municipio de residencia al modificar los datos personales", async () => {
        const { repository, useCase } = setup();

        const profile = createProfile();

        profile.changeResidenceMunicipality(125);

        await repository.save(profile);

        await useCase.execute({
            userId: "user-1",
            firstName: "María",
            lastName: "López",
        });

        const saved = await repository.findByUserId("user-1");

        expect(saved?.residenceMunicipalityId).toBe(125);
        expect(saved?.firstName).toBe("María");
        expect(saved?.lastName).toBe("López");
    });

    it("rechaza un nombre vacío", async () => {
        const { repository, useCase } = setup();

        await expect(
            useCase.execute({
                userId: "user-1",
                firstName: "   ",
                lastName: "García",
            }),
        ).rejects.toThrow("El nombre es obligatorio");

        const saved = await repository.findByUserId("user-1");

        expect(saved).toBeNull();
    });

    it("rechaza apellidos vacíos sin modificar el perfil existente", async () => {
        const { repository, useCase } = setup();

        await repository.save(createProfile());

        await expect(
            useCase.execute({
                userId: "user-1",
                firstName: "María",
                lastName: "   ",
            }),
        ).rejects.toThrow("Los apellidos son obligatorios");

        const saved = await repository.findByUserId("user-1");

        expect(saved?.firstName).toBe("Ana");
        expect(saved?.lastName).toBe("García");
    });
});
