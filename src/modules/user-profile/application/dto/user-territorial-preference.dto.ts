
import type { TerritorialPreferenceScope } from "../../domain/user-territorial-preference";

// ============================================================
// DATOS DE ENTRADA
// ============================================================

export type GetUserTerritorialPreferencesDto = {
  userId: string;
};

// ============================================================
// DATOS DE SALIDA
// ============================================================

export type UserTerritorialPreferenceDto = {
  id: number;
  scope: TerritorialPreferenceScope;
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};
export type SaveUserTerritorialPreferencesDto = {
  userId: string;
  scope: TerritorialPreferenceScope;
  provinceIds: number[];
  countyIds: number[];
  municipalityIds: number[];
};
// ============================================================
// ELIMINAR PREFERENCIAS TERRITORIALES
// ============================================================

export type DeleteUserTerritorialPreferencesDto = {
  userId: string;
};