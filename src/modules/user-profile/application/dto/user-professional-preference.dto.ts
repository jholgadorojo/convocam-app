
import type {
  PreferredSelectionProcessType,
  ProfessionalPreferenceSelection,
} from "../../domain/user-professional-preference";

// ============================================================
// CONSULTAR PREFERENCIAS
// ============================================================

export type GetUserProfessionalPreferencesDto = {
  userId: string;
};

// ============================================================
// GUARDAR PREFERENCIAS
// ============================================================

export type SaveUserProfessionalPreferencesDto =
  ProfessionalPreferenceSelection & {
    userId: string;
  };

// ============================================================
// ELIMINAR PREFERENCIAS
// ============================================================

export type DeleteUserProfessionalPreferencesDto = {
  userId: string;
};

// ============================================================
// DATOS DE SALIDA
// ============================================================

export type UserProfessionalPreferenceDto = {
  id: number;

  selectionProcessType:
    | PreferredSelectionProcessType
    | null;

  subjectAreaIds: number[];

  qualificationGroups: string[];
};
