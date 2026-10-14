
/**
 * Tipos de titulaciones académicas.
 *
 * Deben coincidir con los valores del enum
 * AcademicQualificationType de Prisma.
 */

export const ACADEMIC_QUALIFICATION_TYPES = [
    "PRIMARY",
    "SCHOOL_GRADUATE",
    "ESO",
    "BACCALAUREATE",
    "VOCATIONAL_BASIC",
    "VOCATIONAL_INTERMEDIATE",
    "VOCATIONAL_HIGHER",
    "UNIVERSITY_DIPLOMA",
    "UNIVERSITY_DEGREE",
    "UNIVERSITY_LICENTIATE",
    "UNIVERSITY_MASTER",
    "DOCTORATE",
    "OTHER",
] as const;

export type AcademicQualificationType =
    (typeof ACADEMIC_QUALIFICATION_TYPES)[number];

// ============================================================
// PROPIEDADES
// ============================================================

type UserAcademicQualificationProps = {
    id?: number;
    userProfileId: number;
    qualificationType: AcademicQualificationType;
    name: string;
};

// ============================================================
// ENTIDAD DE DOMINIO
// ============================================================

export class UserAcademicQualification {
    private constructor(
        private readonly props: UserAcademicQualificationProps,
    ) { }

    // ==========================================================
    // CREAR UNA TITULACIÓN NUEVA
    // ==========================================================

    static create(
        input: Omit<UserAcademicQualificationProps, "id">,
    ): UserAcademicQualification {
        this.validateUserProfileId(input.userProfileId);
        this.validateQualificationType(input.qualificationType);

        const name = this.validateName(input.name);

        return new UserAcademicQualification({
            userProfileId: input.userProfileId,
            qualificationType: input.qualificationType,
            name,
        });
    }

    // ==========================================================
    // RECUPERAR UNA TITULACIÓN EXISTENTE
    // ==========================================================

    static restore(
        input: Required<UserAcademicQualificationProps>,
    ): UserAcademicQualification {
        if (
            !Number.isSafeInteger(input.id) ||
            input.id <= 0
        ) {
            throw new Error(
                "El identificador de la titulación no es válido",
            );
        }

        this.validateUserProfileId(input.userProfileId);
        this.validateQualificationType(input.qualificationType);

        const name = this.validateName(input.name);

        return new UserAcademicQualification({
            id: input.id,
            userProfileId: input.userProfileId,
            qualificationType: input.qualificationType,
            name,
        });
    }

    // ==========================================================
    // MODIFICAR UNA TITULACIÓN
    // ==========================================================

    changeDetails(
        qualificationType: AcademicQualificationType,
        name: string,
    ): void {
        UserAcademicQualification.validateQualificationType(
            qualificationType,
        );

        const validatedName =
            UserAcademicQualification.validateName(name);

        this.props.qualificationType = qualificationType;
        this.props.name = validatedName;
    }
    // ==========================================================
    // VALIDACIONES
    // ==========================================================

    private static validateUserProfileId(
        userProfileId: number,
    ): void {
        if (
            !Number.isSafeInteger(userProfileId) ||
            userProfileId <= 0
        ) {
            throw new Error(
                "El identificador del perfil no es válido",
            );
        }
    }

    private static validateQualificationType(
        qualificationType: string,
    ): void {
        const isValid = ACADEMIC_QUALIFICATION_TYPES.some(
            (type) => type === qualificationType,
        );

        if (!isValid) {
            throw new Error(
                "El tipo de titulación académica no es válido",
            );
        }
    }

    private static validateName(name: string): string {
        const normalizedName = name.trim();

        if (!normalizedName) {
            throw new Error(
                "La denominación de la titulación es obligatoria",
            );
        }

        return normalizedName;
    }

    // ==========================================================
    // GETTERS
    // ==========================================================

    get id(): number | undefined {
        return this.props.id;
    }

    get userProfileId(): number {
        return this.props.userProfileId;
    }

    get qualificationType(): AcademicQualificationType {
        return this.props.qualificationType;
    }

    get name(): string {
        return this.props.name;
    }
}
