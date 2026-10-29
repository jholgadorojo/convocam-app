import { ExternalLink } from "lucide-react";
import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { DetailSection } from "./detail-section";
import { buildOfficialSources } from "./detail-presentation";

/** Enlaces a las fuentes oficiales y aviso de consultarlas siempre. */
export function OfficialSourcesSection({
  selectionProcess,
}: {
  selectionProcess: SelectionProcessDetailDto;
}) {
  const officialSources = buildOfficialSources(selectionProcess);

  return (
    <DetailSection title="Fuentes oficiales">
      <div className="flex flex-col gap-2">
        {officialSources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-4 rounded-lg border border-[#E3E7EE] bg-[#FAFBFC] px-4 py-3 hover:bg-[#F4F6F9]"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#131A2C]">
                {source.label}
              </p>
              {source.description && (
                <p className="mt-0.5 text-xs text-[#69738A]">
                  {source.description}
                </p>
              )}
            </div>
            <ExternalLink size={15} className="shrink-0 text-[#4F5BD5]" />
          </a>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[#646E85]">
        Convoca&apos;m organiza información pública para facilitar su consulta.
        Revisa siempre las fuentes oficiales antes de presentar una solicitud.
      </p>
    </DetailSection>
  );
}
