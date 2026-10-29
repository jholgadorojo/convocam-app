import type { UserProfessionalPreferenceDto } from
  "@/modules/user-profile/application/dto/user-professional-preference.dto";
import type { UserTerritorialPreferenceDto } from
  "@/modules/user-profile/application/dto/user-territorial-preference.dto";

/**
 * SPEC-008 - Funciones de presentación de «Para mí».
 *
 * Funciones puras (sin React ni acceso a datos).
 */

/** Página solicitada en la URL; 1 si falta o no es válida. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return raw && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** URL de «Para mí» conservando el municipio seleccionado en el mapa. */
export function pageHref(
  page: number,
  municipality: string | null,
  province: string | null,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (municipality) {
    params.set("municipality", municipality);
    if (province) params.set("province", province);
  }
  const query = params.toString();
  return query ? `/para-mi?${query}` : "/para-mi";
}

export function locationText(
  institution: {
    municipality: string | null;
    county: string | null;
  } | null,
): string {
  if (!institution) return "Ubicación del organismo no disponible";
  const parts = [institution.municipality, institution.county].filter(Boolean);
  return parts.length > 0
    ? parts.join(" · ")
    : "Ubicación del organismo no disponible";
}

/**
 * Motivos de «¿Por qué aparece para mí?».
 *
 * Se obtienen de las preferencias guardadas por el usuario,
 * así que son los mismos para todas las convocatorias.
 */
export function getMatchReasons(
  territorialPreferences:
    Pick<UserTerritorialPreferenceDto, "scope"> | null,
  professionalPreferences:
    Pick<
      UserProfessionalPreferenceDto,
      "selectionProcessType" | "subjectAreaIds" | "qualificationGroups"
    > | null,
): string[] {
  const matchReasons: string[] = [];

  if (territorialPreferences?.scope === "SELECTED_TERRITORIES") {
    matchReasons.push("Ubicación del organismo");
  }

  if (professionalPreferences?.selectionProcessType === "POSITIONS") {
    matchReasons.push("Plazas de plantilla");
  } else if (
    professionalPreferences?.selectionProcessType === "JOB_POOLS"
  ) {
    matchReasons.push("Bolsas de trabajo");
  }

  if ((professionalPreferences?.subjectAreaIds.length ?? 0) > 0) {
    matchReasons.push("Materias profesionales");
  }

  if ((professionalPreferences?.qualificationGroups.length ?? 0) > 0) {
    matchReasons.push("Grupo de titulación");
  }

  return matchReasons;
}
