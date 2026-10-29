import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Target,
} from "lucide-react";
import type { SelectionProcessListItem } from
  "@/modules/selection-process/application/selection-process-list-item";
import { getOfficialStatusPresentation } from
  "@/modules/selection-process/presentation/selection-process-status";
import { formatSelectionProcessTitle } from
  "@/modules/selection-process/presentation/selection-process-title";
import {
  dashboardDetailHref,
  getOpportunityDateText,
  secondaryDetailButtonClasses,
} from "./dashboard-presentation";

/** Panel derecho: las tres mejores oportunidades aún no seguidas. */
export function NewOpportunitiesPanel({
  items,
  preferencesNotConfigured,
}: {
  items: SelectionProcessListItem[];
  preferencesNotConfigured: boolean;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1F5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target size={19} className="text-[#4F5BD5]" />
            <h2 className="text-lg font-semibold text-[#131A2C]">
              Oportunidades para mí
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#69738A]">
            Las tres primeras coincidencias con tu perfil que aún no sigues.
          </p>
        </div>
      </div>
      {preferencesNotConfigured ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            Aún no has configurado tus preferencias.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Completa tus preferencias territoriales o profesionales en Mi perfil
            para encontrar convocatorias para ti.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-8">
          <p className="text-sm font-medium text-[#4E5870]">
            No hay oportunidades nuevas en este momento.
          </p>
          <p className="mt-1 text-sm text-[#69738A]">
            Todas tus coincidencias están en seguimiento o no hay convocatorias
            activas que cumplan tus preferencias.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEF1F5]">
          {items.map((item) => {
            const officialStatus = getOfficialStatusPresentation(
              item.status,
              item.statusId,
            );
            return (
              <article
                key={item.id}
                className="min-w-0 py-4 first:pt-4 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${officialStatus.badgeClassName}`}
                  >
                    {officialStatus.label}
                  </span>
                  <span className="rounded-full bg-[#F4F6F9] px-2.5 py-1 text-xs font-medium text-[#4E5870]">
                    {item.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
                  </span>
                </div>
                <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug text-[#131A2C]">
                  {formatSelectionProcessTitle(item.title)}
                </h3>
                <p className="mt-2 flex items-start gap-1.5 text-sm text-[#4E5870]">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#7C859B]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">
                    {item.institution?.municipality || "Municipio no indicado"}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-start gap-1.5 text-xs text-[#69738A]">
                    <CalendarDays size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {getOpportunityDateText(item)}
                  </span>
                </div>
                {/* Revisar antes de seguir: la decision se toma en el detalle. */}
                <div className="mt-3 flex justify-end border-t border-[#EEF1F5] pt-3">
                  <Link
                    href={dashboardDetailHref(item.id)}
                    className={secondaryDetailButtonClasses}
                  >
                    Ver detalle
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
