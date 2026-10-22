import { afterAll, beforeAll, beforeEach, describe, expect, it, } from "vitest";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { PrismaSelectionProcessQueryRepository } from "./prisma-selection-process-query-repository";
const PREFIX = "TEST-CONVOCAM-SEARCH";
// Solo se utilizan usuarios de prueba, nunca cuentas reales.
const FIRST_USER_ID = `${PREFIX}-USER-1`;
const SECOND_USER_ID = `${PREFIX}-USER-2`;
const TEST_USER_IDS = [FIRST_USER_ID, SECOND_USER_ID];
// Fechas relativas a hoy para que los tests no caduquen con el tiempo.
function daysFromToday(days: number): Date {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}
describe("PrismaSelectionProcessQueryRepository", () => {
    const repository = new PrismaSelectionProcessQueryRepository(prisma);
    let institutionId: number;
    let otherInstitutionId: number;
    // Crea un seguimiento real en PostgreSQL sin tocar casos de uso externos.
    async function followTestSelectionProcess(userId: string, processNumber: number): Promise<void> {
        await prisma.userSelectionProcess.create({
            data: {
                user: { connect: { id: userId } },
                selectionProcess: {
                    connect: { cidoId: `${PREFIX}-SP-${processNumber}` },
                },
            },
        });
    }
    beforeAll(async () => {
        /**
         * Limpiamos posibles datos
         * sobrantes de una ejecución anterior.
         */
        await prisma.selectionProcess.deleteMany({
            where: {
                cidoId: {
                    startsWith: PREFIX,
                },
            },
        });
        await prisma.institution.deleteMany({
            where: {
                cidoId: {
                    startsWith: PREFIX,
                },
            },
        });
        // Eliminar únicamente los usuarios de prueba de esta suite.
        await prisma.user.deleteMany({
            where: { id: { in: TEST_USER_IDS } },
        });
        await prisma.user.createMany({
            data: [
                {
                    id: FIRST_USER_ID,
                    name: "Usuario de prueba 1",
                    email: "convocam-search-test-1@example.invalid",
                },
                {
                    id: SECOND_USER_ID,
                    name: "Usuario de prueba 2",
                    email: "convocam-search-test-2@example.invalid",
                },
            ],
        });
        /**
         * Institución principal.
         */
        const institution = await prisma.institution.create({
            data: {
                cidoId: `${PREFIX}-INSTITUTION-1`,
                name: "Institut Convocam Informàtica",
                shortName: "Convocam Test",
                isActive: true,
                municipality: "Municipi Convocam",
                county: "Vallès Convocam",
                province: "Barcelona Convocam",
            },
        });
        institutionId =
            institution.id;
        /**
         * Otra institución para comprobar
         * que el territorio filtra bien.
         */
        const otherInstitution = await prisma.institution.create({
            data: {
                cidoId: `${PREFIX}-INSTITUTION-2`,
                name: "Ajuntament Exterior",
                shortName: "Exterior",
                isActive: true,
                municipality: "Municipi Exterior",
                county: "Comarca Exterior",
                province: "Girona Convocam",
            },
        });
        otherInstitutionId =
            otherInstitution.id;
        /**
         * Convocatoria 1
         *
         * La mejor coincidencia para
         * "informatic" porque aparece
         * directamente en el título.
         */
        await prisma.selectionProcess.create({
            data: {
                cidoId: `${PREFIX}-SP-1`,
                cidoIdentifier: `${PREFIX}-IDENTIFIER-1`,
                title: "Tècnic informàtic",
                isJobPool: false,
                scopeId: 1,
                scopeName: "Administració local",
                institutionName: institution.name,
                institutionId,
                qualificationGroupId: 2,
                qualificationGroup: "A2",
                selectionSystemId: 1,
                selectionSystem: "Concurs oposició",
                personnelTypeId: 1,
                personnelType: "Funcionari",
                applicationEndDate: daysFromToday(10),
                reservedDisabilityPositions: 1,
                reservedUnemployed: false,
                reservedYoung: false,
                reservedWomen: false,
                cidoUrl: "https://example.com/test-1",
                statusId: 3,
                status: "Termini obert",
                sourceActive: true,
            },
        });
        /**
         * Convocatoria 2
         *
         * No contiene "informatic" en
         * el título, pero sí lo contiene
         * la institución.
         */
        await prisma.selectionProcess.create({
            data: {
                cidoId: `${PREFIX}-SP-2`,
                cidoIdentifier: `${PREFIX}-IDENTIFIER-2`,
                title: "Administratiu",
                isJobPool: false,
                scopeId: 1,
                scopeName: "Administració local",
                institutionName: institution.name,
                institutionId,
                qualificationGroupId: 4,
                qualificationGroup: "C1",
                selectionSystemId: 1,
                selectionSystem: "Concurs oposició",
                personnelTypeId: 1,
                personnelType: "Funcionari",
                applicationEndDate: daysFromToday(40),
                reservedDisabilityPositions: 0,
                reservedUnemployed: false,
                reservedYoung: false,
                reservedWomen: false,
                cidoUrl: "https://example.com/test-2",
                statusId: 3,
                status: "Termini obert",
                sourceActive: true,
            },
        });
        /**
         * Convocatoria 3
         *
         * Bolsa de trabajo y grupo C2.
         */
        await prisma.selectionProcess.create({
            data: {
                cidoId: `${PREFIX}-SP-3`,
                cidoIdentifier: `${PREFIX}-IDENTIFIER-3`,
                title: "Auxiliar administratiu",
                isJobPool: true,
                scopeId: 1,
                scopeName: "Administració local",
                institutionName: institution.name,
                institutionId,
                qualificationGroupId: 5,
                qualificationGroup: "C2",
                applicationEndDate: daysFromToday(70),
                reservedDisabilityPositions: 0,
                reservedUnemployed: true,
                reservedYoung: true,
                reservedWomen: false,
                cidoUrl: "https://example.com/test-3",
                statusId: 2,
                status: "Pendent de termini",
                sourceActive: true,
            },
        });
        /**
         * Convocatoria inactiva.
         *
         * Nunca debería aparecer.
         */
        await prisma.selectionProcess.create({
            data: {
                cidoId: `${PREFIX}-SP-INACTIVE`,
                cidoIdentifier: `${PREFIX}-IDENTIFIER-INACTIVE`,
                title: "Tècnic informàtic inactiu",
                isJobPool: false,
                scopeId: 1,
                scopeName: "Administració local",
                institutionName: institution.name,
                institutionId,
                qualificationGroup: "A2",
                reservedUnemployed: false,
                reservedYoung: false,
                reservedWomen: false,
                cidoUrl: "https://example.com/inactive",
                statusId: 3,
                status: "Termini obert",
                sourceActive: false,
            },
        });
        /**
         * Convocatoria de otro territorio.
         */
        await prisma.selectionProcess.create({
            data: {
                cidoId: `${PREFIX}-SP-OUTSIDE`,
                cidoIdentifier: `${PREFIX}-IDENTIFIER-OUTSIDE`,
                title: "Tècnic informàtic exterior",
                isJobPool: false,
                scopeId: 1,
                scopeName: "Administració local",
                institutionName: otherInstitution.name,
                institutionId: otherInstitutionId,
                qualificationGroup: "A2",
                reservedUnemployed: false,
                reservedYoung: false,
                reservedWomen: false,
                cidoUrl: "https://example.com/outside",
                statusId: 3,
                status: "Termini obert",
                sourceActive: true,
            },
        });
    });
    beforeEach(async () => {
        await prisma.userSelectionProcess.deleteMany({
            where: { userId: { in: TEST_USER_IDS } },
        });
    });
    afterAll(async () => {
        await prisma.selectionProcess.deleteMany({
            where: {
                cidoId: {
                    startsWith: PREFIX,
                },
            },
        });
        await prisma.institution.deleteMany({
            where: {
                cidoId: {
                    startsWith: PREFIX,
                },
            },
        });
        // Las relaciones de seguimiento se eliminan por cascada.
        await prisma.user.deleteMany({
            where: { id: { in: TEST_USER_IDS } },
        });
        await prisma.$disconnect();
    });
    it("returns only active selection processes", async () => {
        const result = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
        });
        expect(result.totalItems).toBe(3);
        expect(result.items.some((item) => item.cidoIdentifier ===
            `${PREFIX}-IDENTIFIER-INACTIVE`)).toBe(false);
    });
    it("filters by province, county and municipality", async () => {
        const result = await repository.findActive(1, 20, {
            province: "Barcelona Convocam",
            county: "Vallès Convocam",
            municipality: "Municipi Convocam",
        });
        expect(result.totalItems).toBe(3);
        for (const item of result.items) {
            expect(item.institution
                ?.province).toBe("Barcelona Convocam");
            expect(item.institution
                ?.county).toBe("Vallès Convocam");
            expect(item.institution
                ?.municipality).toBe("Municipi Convocam");
        }
    });
    it("filters by multiple qualification groups", async () => {
        const result = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            qualificationGroup: [
                "A2",
                "C1",
            ],
        });
        expect(result.totalItems).toBe(2);
        expect(result.items.map((item) => item.qualificationGroup)).toEqual(expect.arrayContaining([
            "A2",
            "C1",
        ]));
    });
    it("filters job pools", async () => {
        const result = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            isJobPool: true,
        });
        expect(result.totalItems).toBe(1);
        expect(result.items[0]
            .isJobPool).toBe(true);
    });
    it("finds text ignoring accents", async () => {
        const result = await repository.findActive(1, 20, {
            text: "informatic",
            municipality: "Municipi Convocam",
        });
        expect(result.totalItems).toBeGreaterThan(0);
        expect(result.items.some((item) => item.title ===
            "Tècnic informàtic")).toBe(true);
    });
    it("supports tolerant text search", async () => {
        const result = await repository.findActive(1, 20, {
            text: "informatics",
            municipality: "Municipi Convocam",
        });
        expect(result.items.some((item) => item.title ===
            "Tècnic informàtic")).toBe(true);
    });
    it("orders text results by relevance", async () => {
        const result = await repository.findActive(1, 20, {
            text: "informatic",
            municipality: "Municipi Convocam",
        });
        /**
         * SP-1 tiene informàtic
         * directamente en el título.
         *
         * SP-2 solamente lo encuentra
         * por el nombre de institución.
         *
         * Por tanto SP-1 debe ir primero.
         */
        expect(result.items[0]
            .cidoIdentifier).toBe(`${PREFIX}-IDENTIFIER-1`);
    });
    it("paginates results", async () => {
        const firstPage = await repository.findActive(1, 2, {
            municipality: "Municipi Convocam",
        });
        expect(firstPage.totalItems).toBe(3);
        expect(firstPage.totalPages).toBe(2);
        expect(firstPage.items).toHaveLength(2);
        const secondPage = await repository.findActive(2, 2, {
            municipality: "Municipi Convocam",
        });
        expect(secondPage.items).toHaveLength(1);
        expect(secondPage.page).toBe(2);
    });
    it("orders results by application end date when there is no text search", async () => {
        const result = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
        });
        expect(result.items.map((item) => item.cidoIdentifier)).toEqual([
            `${PREFIX}-IDENTIFIER-1`,
            `${PREFIX}-IDENTIFIER-2`,
            `${PREFIX}-IDENTIFIER-3`,
        ]);
    });
    it("ordena primero los plazos pendientes y deja los finalizados al final", async () => {
        const deadlineInstitution = await prisma.institution.create({
            data: {
                cidoId: `${PREFIX}-INSTITUTION-DEADLINE`,
                name: "Ajuntament Terminis",
                shortName: "Terminis",
                isActive: true,
                municipality: "Municipi Terminis",
                county: "Comarca Terminis",
                province: "Lleida Convocam",
            },
        });
        const deadlines: Array<[string, Date | null]> = [
            ["CLOSED", daysFromToday(-10)],
            ["FAR", daysFromToday(40)],
            ["NO-DATE", null],
            ["NEAR", daysFromToday(5)],
        ];
        for (const [suffix, applicationEndDate] of deadlines) {
            await prisma.selectionProcess.create({
                data: {
                    cidoId: `${PREFIX}-SP-DEADLINE-${suffix}`,
                    cidoIdentifier: `${PREFIX}-DEADLINE-${suffix}`,
                    title: `Convocatòria ${suffix}`,
                    isJobPool: false,
                    scopeId: 1,
                    scopeName: "Administració local",
                    institutionName: deadlineInstitution.name,
                    institutionId: deadlineInstitution.id,
                    qualificationGroupId: 2,
                    qualificationGroup: "A2",
                    selectionSystemId: 1,
                    selectionSystem: "Concurs oposició",
                    personnelTypeId: 1,
                    personnelType: "Funcionari",
                    applicationEndDate,
                    reservedDisabilityPositions: 0,
                    reservedUnemployed: false,
                    reservedYoung: false,
                    reservedWomen: false,
                    cidoUrl: `https://example.com/deadline-${suffix}`,
                    statusId: 3,
                    status: "Termini obert",
                    sourceActive: true,
                },
            });
        }
        const filters = {
            municipality: "Municipi Terminis",
            sort: "deadline-asc" as const,
        };
        const result = await repository.findActive(1, 20, filters);
        expect(result.totalItems).toBe(4);
        expect(result.items.map((item) => item.cidoIdentifier)).toEqual([
            `${PREFIX}-DEADLINE-NEAR`,
            `${PREFIX}-DEADLINE-FAR`,
            `${PREFIX}-DEADLINE-NO-DATE`,
            `${PREFIX}-DEADLINE-CLOSED`,
        ]);
        // La paginación respeta el mismo orden al cruzar de un grupo a otro.
        const secondPage = await repository.findActive(2, 3, filters);
        expect(secondPage.items.map((item) => item.cidoIdentifier)).toEqual([
            `${PREFIX}-DEADLINE-CLOSED`,
        ]);
    });
    /**
     * SPEC-009 — Verificar la exclusión real en PostgreSQL.
     * Las consultas se limitan a los tres procesos activos de nuestra
     * institución de prueba; los demás registros no interfieren.
     */
    it("conserva los resultados seguidos cuando no se solicita exclusión", async () => {
        await followTestSelectionProcess(FIRST_USER_ID, 1);
        const result = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            statusId: [2, 3],
        });
        expect(result.totalItems).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items.map((item) => item.cidoIdentifier))
            .toContain(`${PREFIX}-IDENTIFIER-1`);
    });
    it("excluye los procesos seguidos solo por el usuario indicado", async () => {
        await followTestSelectionProcess(FIRST_USER_ID, 1);
        await followTestSelectionProcess(SECOND_USER_ID, 2);
        const firstUserResult = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            statusId: [2, 3],
            excludeFollowedByUserId: FIRST_USER_ID,
        });
        const secondUserResult = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            statusId: [2, 3],
            excludeFollowedByUserId: SECOND_USER_ID,
        });
        expect(firstUserResult.totalItems).toBe(2);
        expect(firstUserResult.items.map((item) => item.cidoIdentifier))
            .toEqual(expect.arrayContaining([
            `${PREFIX}-IDENTIFIER-2`,
            `${PREFIX}-IDENTIFIER-3`,
        ]));
        expect(firstUserResult.items.map((item) => item.cidoIdentifier))
            .not.toContain(`${PREFIX}-IDENTIFIER-1`);
        expect(secondUserResult.totalItems).toBe(2);
        expect(secondUserResult.items.map((item) => item.cidoIdentifier))
            .toEqual(expect.arrayContaining([
            `${PREFIX}-IDENTIFIER-1`,
            `${PREFIX}-IDENTIFIER-3`,
        ]));
        expect(secondUserResult.items.map((item) => item.cidoIdentifier))
            .not.toContain(`${PREFIX}-IDENTIFIER-2`);
    });
    it.each(["deadline-asc", "deadline-priority"] as const)("excluye antes de contar y paginar con ordenación %s", async (sort) => {
        await followTestSelectionProcess(FIRST_USER_ID, 1);
        const filters = {
            municipality: "Municipi Convocam",
            statusId: [2, 3],
            sort,
            excludeFollowedByUserId: FIRST_USER_ID,
        };
        const firstPage = await repository.findActive(1, 1, filters);
        const secondPage = await repository.findActive(2, 1, filters);
        const thirdPage = await repository.findActive(3, 1, filters);
        for (const page of [firstPage, secondPage, thirdPage]) {
            expect(page.totalItems).toBe(2);
            expect(page.totalPages).toBe(2);
            expect(page.pageSize).toBe(1);
        }
        expect(firstPage.items).toHaveLength(1);
        expect(secondPage.items).toHaveLength(1);
        expect(thirdPage.items).toHaveLength(0);
        const identifiers = [
            ...firstPage.items,
            ...secondPage.items,
        ].map((item) => item.cidoIdentifier);
        expect(identifiers).toHaveLength(2);
        expect(new Set(identifiers).size).toBe(2);
        expect(identifiers).toEqual(expect.arrayContaining([
            `${PREFIX}-IDENTIFIER-2`,
            `${PREFIX}-IDENTIFIER-3`,
        ]));
        expect(identifiers).not.toContain(`${PREFIX}-IDENTIFIER-1`);
    });
    it("combina la exclusión con las preferencias profesionales", async () => {
        await followTestSelectionProcess(FIRST_USER_ID, 1);
        const result = await repository.findActive(1, 3, {
            municipality: "Municipi Convocam",
            statusId: [2, 3],
            qualificationGroup: ["A2", "C1"],
            excludeFollowedByUserId: FIRST_USER_ID,
            sort: "deadline-priority",
        });
        expect(result.totalItems).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(result.items.map((item) => item.cidoIdentifier)).toEqual([
            `${PREFIX}-IDENTIFIER-2`,
        ]);
    });
    it("no excluye nada si el usuario no sigue ninguna convocatoria", async () => {
        await followTestSelectionProcess(FIRST_USER_ID, 1);
        const result = await repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            statusId: [2, 3],
            excludeFollowedByUserId: SECOND_USER_ID,
        });
        expect(result.totalItems).toBe(3);
        expect(result.items).toHaveLength(3);
    });
    it("rechaza un identificador de usuario vacío para la exclusión", async () => {
        await expect(repository.findActive(1, 20, {
            municipality: "Municipi Convocam",
            excludeFollowedByUserId: "   ",
        })).rejects.toThrow("excludeFollowedByUserId must not be empty");
    });
});
