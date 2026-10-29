import { ExternalLink, FileText, GraduationCap } from "lucide-react";
import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { DetailSection } from "./detail-section";
import {
  buildRequirements,
  findBasesDocument,
} from "./detail-presentation";

/** Requisitos de acceso y enlace al documento de bases si se encuentra. */
export function RequirementsSection({
  selectionProcess,
}: {
  selectionProcess: SelectionProcessDetailDto;
}) {
  const requirements = buildRequirements(selectionProcess);
  const basesDocument = findBasesDocument(selectionProcess.documents);

  return (
    <DetailSection title="Requisitos">
      {requirements.length > 0 ? (
        <div className="flex flex-col gap-3">
          {requirements.map((requirement, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] px-4 py-3"
            >
              <GraduationCap size={18} className="mt-0.5 shrink-0 text-[#4F5BD5]" />
              <p className="text-sm leading-relaxed text-[#4E5870]">
                {requirement}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] px-4 py-3">
          <p className="text-sm leading-relaxed text-[#4E5870]">
            No hay información estructurada de requisitos. Consulta las bases
            oficiales.
          </p>
        </div>
      )}
      {basesDocument && (
        <a
          href={basesDocument.documentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
        >
          <FileText size={16} />
          Abrir las bases
          <ExternalLink size={14} />
        </a>
      )}
    </DetailSection>
  );
}
