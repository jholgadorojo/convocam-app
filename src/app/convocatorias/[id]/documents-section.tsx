import { ExternalLink } from "lucide-react";
import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { decodeHtmlEntities } from "@/shared/presentation/decode-html-entities";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import { DetailSection } from "./detail-section";

/** Publicaciones oficiales de la convocatoria con enlace al documento. */
export function DocumentsSection({
  documents,
}: {
  documents: SelectionProcessDetailDto["documents"];
}) {
  return (
    <DetailSection title="Documentos oficiales">
      {documents.length === 0 ? (
        <p className="text-sm text-[#69738A]">
          No hay documentos oficiales disponibles.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-lg border border-[#E3E7EE] bg-[#FAFBFC] p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF0FC] px-2.5 py-1 text-[11px] font-semibold text-[#3B45B5]">
                      {document.phase}
                    </span>
                    <span className="text-xs font-medium text-[#7C859B]">
                      {formatCalendarDate(document.publicationDate)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#131A2C]">
                    {decodeHtmlEntities(document.summary)}
                  </p>
                  <div className="mt-2 flex flex-col gap-1 text-xs leading-relaxed text-[#69738A]">
                    {document.publisher && (
                      <p>Publica: {document.publisher}</p>
                    )}
                    <p>
                      {document.bulletin}
                      {document.bulletinNumber !== null &&
                        ` · nº ${document.bulletinNumber}`}
                    </p>
                    {document.phaseNotes && <p>{document.phaseNotes}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={document.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F5BD5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B45B5]"
                  >
                    Documento
                    <ExternalLink size={13} />
                  </a>
                  {document.htmlUrl && (
                    <a
                      href={document.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                    >
                      HTML
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DetailSection>
  );
}
