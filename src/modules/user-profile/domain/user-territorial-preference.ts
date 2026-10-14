
export const TERRITORIAL_PREFERENCE_SCOPES = [
  "ALL_CATALONIA",
  "SELECTED_TERRITORIES",
] as const;

export type TerritorialPreferenceScope =
  (typeof TERRITORIAL_PREFERENCE_SCOPES)[number];

// ============================================================
// SELECCIÓN DE TERRITORIOS
// ============================================================

export type TerritorialSelection = {
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};

// ============================================================
// PROPIEDADES DE LA ENTIDAD
// ============================================================

type UserTerritorialPreferenceProps = {
  id?: number;
  userProfileId: number;
  scope: TerritorialPreferenceScope;
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};

// ============================================================
// ENTIDAD DE DOMINIO
// ============================================================

export class UserTerritorialPreference {
  private constructor(
    private readonly props: UserTerritorialPreferenceProps,
  ) {}

  // ==========================================================
  // CREAR PREFERENCIA: TODA CATALUNYA
  // ==========================================================

  static createAllCatalonia(
    userProfileId: number,
  ): UserTerritorialPreference {
    this.validateUserProfileId(userProfileId);

    return new UserTerritorialPreference({
      userProfileId,
      scope: "ALL_CATALONIA",
      provinceIds: [],
      countyIds: [],
      municipalityIds: [],
    });
  }

  // ==========================================================
  // CREAR PREFERENCIA: TERRITORIOS SELECCIONADOS
  // ==========================================================

  static createSelectedTerritories(
    userProfileId: number,
    selection: TerritorialSelection,
  ): UserTerritorialPreference {
    this.validateUserProfileId(userProfileId);

    const normalized = this.normalizeSelection(selection);

    this.validateSelectedTerritories(normalized);

    return new UserTerritorialPreference({
      userProfileId,
      scope: "SELECTED_TERRITORIES",
      ...normalized,
    });
  }

  // ==========================================================
  // RECUPERAR PREFERENCIA EXISTENTE
  // ==========================================================

  static restore(
    props: Required<UserTerritorialPreferenceProps>,
  ): UserTerritorialPreference {
    if (
      !Number.isSafeInteger(props.id) ||
      props.id <= 0
    ) {
      throw new Error(
        "El identificador de las preferencias no es válido",
      );
    }

    this.validateUserProfileId(props.userProfileId);

    if (
      !TERRITORIAL_PREFERENCE_SCOPES.includes(
        props.scope,
      )
    ) {
      throw new Error(
        "El ámbito territorial no es válido",
      );
    }

    const normalized = this.normalizeSelection(props);

    if (props.scope === "ALL_CATALONIA") {
      if (this.hasSelectedTerritories(normalized)) {
        throw new Error(
          "Toda Catalunya no puede tener territorios seleccionados",
        );
      }
    } else {
      this.validateSelectedTerritories(normalized);
    }

    return new UserTerritorialPreference({
      id: props.id,
      userProfileId: props.userProfileId,
      scope: props.scope,
      ...normalized,
    });
  }

  // ==========================================================
  // CAMBIAR A TODA CATALUNYA
  // ==========================================================

  selectAllCatalonia(): void {
    this.props.scope = "ALL_CATALONIA";
    this.props.provinceIds = [];
    this.props.countyIds = [];
    this.props.municipalityIds = [];
  }

  // ==========================================================
  // CAMBIAR A TERRITORIOS SELECCIONADOS
  // ==========================================================

  selectTerritories(
    selection: TerritorialSelection,
  ): void {
    const normalized =
      UserTerritorialPreference.normalizeSelection(
        selection,
      );

    UserTerritorialPreference.validateSelectedTerritories(
      normalized,
    );

    this.props.scope = "SELECTED_TERRITORIES";
    this.props.provinceIds = normalized.provinceIds;
    this.props.countyIds = normalized.countyIds;
    this.props.municipalityIds = normalized.municipalityIds;
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

  private static normalizeIds(
    ids: number[],
  ): number[] {
    if (!Array.isArray(ids)) {
      throw new Error(
        "La selección de territorios no es válida",
      );
    }

    for (const id of ids) {
      if (
        !Number.isSafeInteger(id) ||
        id <= 0
      ) {
        throw new Error(
          "El identificador territorial no es válido",
        );
      }
    }

    // Eliminar duplicados conservando el orden.
    return [...new Set(ids)];
  }

  private static normalizeSelection(
    selection: TerritorialSelection,
  ): TerritorialSelection {
    return {
      provinceIds: this.normalizeIds(
        selection.provinceIds,
      ),
      countyIds: this.normalizeIds(
        selection.countyIds,
      ),
      municipalityIds: this.normalizeIds(
        selection.municipalityIds,
      ),
    };
  }

  private static hasSelectedTerritories(
    selection: TerritorialSelection,
  ): boolean {
    return (
      selection.provinceIds.length > 0 ||
      selection.countyIds.length > 0 ||
      selection.municipalityIds.length > 0
    );
  }

  private static validateSelectedTerritories(
    selection: TerritorialSelection,
  ): void {
    if (!this.hasSelectedTerritories(selection)) {
      throw new Error(
        "Debes seleccionar al menos un territorio",
      );
    }
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

  get scope(): TerritorialPreferenceScope {
    return this.props.scope;
  }

  get provinceIds(): number[] {
    return [...this.props.provinceIds];
  }

  get countyIds(): number[] {
    return [...this.props.countyIds];
  }

  get municipalityIds(): number[] {
    return [...this.props.municipalityIds];
  }
}
