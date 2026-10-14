
import type { UserAcademicQualificationRepository } from "../../application/repositories/user-academic-qualification.repository";

import { UserAcademicQualification } from "../../domain/user-academic-qualification";

export class InMemoryUserAcademicQualificationRepository
    implements UserAcademicQualificationRepository {
    private qualifications: UserAcademicQualification[] = [];

    private nextId = 1;

    // ==========================================================
    // LISTAR TITULACIONES DE UN PERFIL
    // ==========================================================

    async listByUserProfileId(
        userProfileId: number,
    ): Promise<UserAcademicQualification[]> {
        return this.qualifications
            .filter(
                (qualification) =>
                    qualification.userProfileId === userProfileId,
            )
            .map((qualification) => this.copy(qualification));
    }

    // ==========================================================
    // BUSCAR UNA TITULACIÓN DE UN PERFIL
    // ==========================================================

    async findByIdAndUserProfileId(
        id: number,
        userProfileId: number,
    ): Promise<UserAcademicQualification | null> {
        const qualification = this.qualifications.find(
            (item) =>
                item.id === id &&
                item.userProfileId === userProfileId,
        );

        return qualification
            ? this.copy(qualification)
            : null;
    }

    // ==========================================================
    // CREAR O ACTUALIZAR UNA TITULACIÓN
    // ==========================================================

    async save(
        qualification: UserAcademicQualification,
    ): Promise<UserAcademicQualification> {
        // CREACIÓN
        if (qualification.id === undefined) {
            const saved = UserAcademicQualification.restore({
                id: this.nextId,
                userProfileId: qualification.userProfileId,
                qualificationType: qualification.qualificationType,
                name: qualification.name,
            });

            this.nextId += 1;
            this.qualifications.push(saved);

            return this.copy(saved);
        }

        // ACTUALIZACIÓN
        const index = this.qualifications.findIndex(
            (item) => item.id === qualification.id,
        );

        if (index === -1) {
            throw new Error("La titulación académica no existe");
        }

        // No permitir cambiar la titulación de perfil.
        if (
            this.qualifications[index].userProfileId !==
            qualification.userProfileId
        ) {
            throw new Error(
                "La titulación no pertenece al perfil indicado",
            );
        }

        const updated = this.copy(qualification);

        this.qualifications[index] = updated;

        return this.copy(updated);
    }

    // ==========================================================
    // ELIMINAR UNA TITULACIÓN DE UN PERFIL
    // ==========================================================

    async deleteByIdAndUserProfileId(
        id: number,
        userProfileId: number,
    ): Promise<boolean> {
        const index = this.qualifications.findIndex(
            (item) =>
                item.id === id &&
                item.userProfileId === userProfileId,
        );

        if (index === -1) {
            return false;
        }

        this.qualifications.splice(index, 1);

        return true;
    }

    // ==========================================================
    // COPIAR ENTIDAD
    // ==========================================================

    private copy(
        qualification: UserAcademicQualification,
    ): UserAcademicQualification {
        if (qualification.id === undefined) {
            throw new Error(
                "La titulación no tiene identificador",
            );
        }

        return UserAcademicQualification.restore({
            id: qualification.id,
            userProfileId: qualification.userProfileId,
            qualificationType: qualification.qualificationType,
            name: qualification.name,
        });
    }
}
