import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { DetailSection } from "./detail-section";

/** Áreas y materias de CIDO; no se muestra si no hay ninguna. */
export function SubjectAreasSection({
  subjectAreas,
}: {
  subjectAreas: SelectionProcessDetailDto["subjectAreas"];
}) {
  if (subjectAreas.length === 0) {
    return null;
  }

  return (
    <DetailSection title="Áreas y materias">
      <div className="flex flex-wrap gap-2">
        {subjectAreas.map((subjectArea) => (
          <span
            key={subjectArea.id}
            className="rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-3 py-1.5 text-xs font-medium text-[#4E5870]"
          >
            {subjectArea.name}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}
