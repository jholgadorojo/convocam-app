import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { DetailSection } from "./detail-section";
import { buildInformation } from "./detail-presentation";

/** Descripción redactada a partir de los datos y observaciones de CIDO. */
export function InformationSection({
  selectionProcess,
}: {
  selectionProcess: SelectionProcessDetailDto;
}) {
  const information = buildInformation(selectionProcess);

  return (
    <DetailSection title="Información">
      <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-[#4E5870]">
        {information.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {selectionProcess.observations && (
        <div className="mt-4 rounded-lg border border-[#E7EAF0] bg-[#F7F8FA] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#646E85]">
            Observaciones
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#4E5870]">
            {selectionProcess.observations}
          </p>
        </div>
      )}
    </DetailSection>
  );
}
