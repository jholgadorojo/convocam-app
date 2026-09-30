import type { SubjectAreaSyncData } from "../../application/subject-area-sync-data";
import type { CidoSubjectAreaResource } from "./cido-subject-area-types";

export function mapCidoSubjectArea(
  resource: CidoSubjectAreaResource,
): SubjectAreaSyncData {
  return {
    cidoId: resource.id,
    name: resource.attributes.materia.trim(),
    cidoModuleId: resource.attributes.idModul,
  };
}