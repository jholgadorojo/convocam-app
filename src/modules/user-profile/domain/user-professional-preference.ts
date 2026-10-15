
export const PREFERRED_SELECTION_PROCESS_TYPES = [
  "POSITIONS",
  "JOB_POOLS",
  "BOTH",
] as const;

export type PreferredSelectionProcessType =
  (typeof PREFERRED_SELECTION_PROCESS_TYPES)[number];

// ============================================================
// SELECCIÓN DE PREFERENCIAS PROFESIONALES
// ============================================================

export type ProfessionalPreferenceSelection = {
  selectionProcessType:
    | PreferredSelectionProcessType
    | null;

  subjectAreaIds: number[];

  qualificationGroups: string[];
};

// ============================================================
// PROPIEDADES DE LA ENTIDAD
// ============================================================

type UserProfessionalPreferenceProps =
  ProfessionalPreferenceSelection & {
    id?: number;
    userProfileId: number;
  };

// ============================================================
// ENTIDAD DE DOMINIO
// ============================================================

export class UserProfessionalPreference {
  private constructor(
    private readonly props: UserProfessionalPreferenceProps,
  ) {}

  // ==========================================================
  // CREAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  static create(
    userProfileId: number,
    selection: ProfessionalPreferenceSelection,
  ): UserProfessionalPreference {
    this.validateUserProfileId(userProfileId);

    const normalized = this.normalizeSelection(
      selection,
    );

    return new UserProfessionalPreference({
      userProfileId,
      ...normalized,
    });
  }

  // ==========================================================
  // RECUPERAR PREFERENCIAS EXISTENTES
  // ==========================================================

  static restore(
    props: Required<UserProfessionalPreferenceProps>,
  ): UserProfessionalPreference {
    if (
      !Number.isSafeInteger(props.id) ||
      props.id <= 0
    ) {
      throw new Error(
        "El identificador de las preferencias profesionales no es válido",
      );
    }

    this.validateUserProfileId(props.userProfileId);

    const normalized = this.normalizeSelection({
      selectionProcessType: props.selectionProcessType,
      subjectAreaIds: props.subjectAreaIds,
      qualificationGroups: props.qualificationGroups,
    });

    return new UserProfessionalPreference({
      id: props.id,
      userProfileId: props.userProfileId,
      ...normalized,
    });
  }

  // ==========================================================
  // MODIFICAR PREFERENCIAS PROFESIONALES
  // ==========================================================

  changePreferences(
    selection: ProfessionalPreferenceSelection,
  ): void {
    const normalized =
      UserProfessionalPreference.normalizeSelection(
        selection,
      );

    // Modificamos la entidad únicamente cuando
    // todos los nuevos datos son válidos.

    this.props.selectionProcessType =
      normalized.selectionProcessType;

    this.props.subjectAreaIds =
      normalized.subjectAreaIds;

    this.props.qualificationGroups =
      normalized.qualificationGroups;
  }

  // ==========================================================
  // VALIDAR IDENTIFICADOR DEL PERFIL
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

  // ==========================================================
  // VALIDAR TIPO DE CONVOCATORIA
  // ==========================================================

  private static validateSelectionProcessType(
    type: PreferredSelectionProcessType | null,
  ): void {
    if (type === null) {
      return;
    }

    if (
      !PREFERRED_SELECTION_PROCESS_TYPES.some(
        (value) => value === type,
      )
    ) {
      throw new Error(
        "El tipo de convocatoria no es válido",
      );
    }
  }

  // ==========================================================
  // NORMALIZAR IDENTIFICADORES DE MATERIAS
  // ==========================================================

  private static normalizeSubjectAreaIds(
    ids: number[],
  ): number[] {
    if (!Array.isArray(ids)) {
      throw new Error(
        "La selección de materias no es válida",
      );
    }

    for (const id of ids) {
      if (
        !Number.isSafeInteger(id) ||
        id <= 0
      ) {
        throw new Error(
          "El identificador de la materia no es válido",
        );
      }
    }

    return [...new Set(ids)];
  }

  // ==========================================================
  // NORMALIZAR GRUPOS DE TITULACIÓN
  // ==========================================================

  private static normalizeQualificationGroups(
    groups: string[],
  ): string[] {
    if (!Array.isArray(groups)) {
      throw new Error(
        "La selección de grupos de titulación no es válida",
      );
    }

    const normalized: string[] = [];

    for (const group of groups) {
      if (typeof group !== "string") {
        throw new Error(
          "El grupo de titulación no es válido",
        );
      }

      const cleanGroup = group.trim();

      if (cleanGroup.length === 0) {
        throw new Error(
          "El grupo de titulación no puede estar vacío",
        );
      }

      normalized.push(cleanGroup);
    }

    return [...new Set(normalized)];
  }

  // ==========================================================
  // NORMALIZAR CONFIGURACIÓN COMPLETA
  // ==========================================================

  private static normalizeSelection(
    selection: ProfessionalPreferenceSelection,
  ): ProfessionalPreferenceSelection {
    if (
      !selection ||
      typeof selection !== "object"
    ) {
      throw new Error(
        "Las preferencias profesionales no son válidas",
      );
    }

    this.validateSelectionProcessType(
      selection.selectionProcessType,
    );

    return {
      selectionProcessType:
        selection.selectionProcessType,

      subjectAreaIds:
        this.normalizeSubjectAreaIds(
          selection.subjectAreaIds,
        ),

      qualificationGroups:
        this.normalizeQualificationGroups(
          selection.qualificationGroups,
        ),
    };
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

  get selectionProcessType():
    | PreferredSelectionProcessType
    | null {
    return this.props.selectionProcessType;
  }

  get subjectAreaIds(): number[] {
    return [...this.props.subjectAreaIds];
  }

  get qualificationGroups(): string[] {
    return [...this.props.qualificationGroups];
  }
}
