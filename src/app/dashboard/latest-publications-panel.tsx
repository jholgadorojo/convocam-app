import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
} from "lucide-react";
import type { DashboardLatestPublicationItem } from
  "@/modules/dashboard/application/dashboard-query-repository";
import { formatSelectionProcessTitle } from
  "@/modules/selection-process/presentation/selection-process-title";
import { decodeHtmlEntities } from "@/shared/presentation/decode-html-entities";
import { formatCalendarDate } from "@/shared/presentation/format-calendar-date";
import {
  dashboardDetailHref,
  secondaryDetailButtonClasses,
} from "./dashboard-presentation";

/** Panel completo: últimas cinco publicaciones oficiales seguidas. */
export function LatestOfficialPublicationsPanel({
  items,
}: {
  items: DashboardLatestPublicationItem[];
}) {
  return (
    <section
      aria-labelledby="dashboard-publications-heading"
      className="min-w-0 rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm"
    >
      <div className="border-b border-[#EEF1F5] pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText size={19} className="shrink-0 text-[#4F5BD5]" />
            <h2
              id="dashboard-publications-heading"
              className="text-lg font-semibold text-[#131A2C]"
            >
              Últimas publicaciones oficiales
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#69738A]">
            Los cinco documentos más recientes publicados desde el día en
            que empezaste a seguir cada convocatoria.
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No hay publicaciones oficiales para mostrar.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Aquí aparecerán los documentos activos publicados desde el día
            en que comenzaste a seguir cada convocatoria.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF1F5]">
          {items.map((item) => (
            <article
              key={item.documentId}
              className="min-w-0 py-4 first:pt-4 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {/* Fecha y convocatoria en una misma fila en pantallas amplias. */}
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
                    <div className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-lg border border-[#BFC7F8] bg-[#EEF0FC] px-3 py-2 shadow-sm">
                      <CalendarDays
                        size={19}
                        className="shrink-0 text-[#3B45B5]"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#4E5870]">
                          Fecha de publicación
                        </span>
                        <time
                          dateTime={item.publicationDate.toISOString().slice(0, 10)}
                          className="mt-0.5 text-base font-bold leading-tight tabular-nums text-[#2D3699]"
                        >
                          {formatCalendarDate(item.publicationDate)}
                        </time>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#69738A]">
                        Convocatoria
                      </p>
                      <p className="mt-1 break-words text-[17px] font-bold leading-snug text-[#131A2C]">
                        {formatSelectionProcessTitle(item.selectionProcessTitle)}
                      </p>
                    </div>
                  </div>
                  {item.phase.trim() !== "" && (
                    <span className="mt-3 inline-flex max-w-full break-words rounded-md bg-[#EEF0FC] px-2.5 py-1.5 text-xs font-medium text-[#3B45B5]">
                      {item.phase}
                    </span>
                  )}
                  {/* El titulo del documento no cambia. */}
                  <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                    {decodeHtmlEntities(item.summary.trim() || "Publicación oficial")}
                  </h3>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-[#4E5870]">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-[#7C859B]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">
                      {item.municipality || "Municipio no indicado"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:flex-col sm:items-end">
                  <Link
                    href={dashboardDetailHref(item.selectionProcessId)}
                    className={secondaryDetailButtonClasses}
                  >
                    Ver detalle
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  {item.documentUrl.trim() !== "" ? (
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={secondaryDetailButtonClasses}
                    >
                      Documento oficial
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#69738A]">
                      Enlace oficial no disponible
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
