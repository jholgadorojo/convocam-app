import type { ReactNode } from "react";
import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { hasReservedPlaces } from "@/modules/selection-process/presentation/selection-process-badges";
import { DetailSection } from "./detail-section";
import { formatNumberOfPositions } from "./detail-presentation";

/** Datos clave de la convocatoria y plazas reservadas. */
export function SummarySection({
  selectionProcess,
}: {
  selectionProcess: SelectionProcessDetailDto;
}) {
  const { reservedPlaces } = selectionProcess;

  return (
    <DetailSection title="Resumen">
      <div className="grid overflow-hidden rounded-lg border border-[#E7EAF0] bg-[#FAFBFC] sm:grid-cols-2 lg:grid-cols-3">
        <SummaryItem
          label="Tipo"
          value={selectionProcess.isJobPool ? "Bolsa de trabajo" : "Plaza de plantilla"}
        />
        <SummaryItem
          label="Plazas"
          value={formatNumberOfPositions(
            selectionProcess.numberOfPositions,
            selectionProcess.isJobPool,
          )}
        />
        <SummaryItem
          label="Grupo"
          value={selectionProcess.qualificationGroup ?? "No especificado"}
        />
        <SummaryItem
          label="Personal"
          value={selectionProcess.personnelType ?? "No especificado"}
        />
        <SummaryItem
          label="Sistema"
          value={selectionProcess.selectionSystem ?? "No especificado"}
        />
        <SummaryItem
          label="Municipio"
          value={selectionProcess.institution?.municipality ?? "No disponible"}
        />
      </div>

      {hasReservedPlaces(reservedPlaces) && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
            Reservas
          </p>
          <div className="flex flex-wrap gap-2">
            {(reservedPlaces.disability ?? 0) > 0 && (
              <ReservationBadge>
                Discapacidad: {reservedPlaces.disability}
              </ReservationBadge>
            )}
            {reservedPlaces.unemployed && (
              <ReservationBadge>Personas desempleadas</ReservationBadge>
            )}
            {reservedPlaces.youngPeople && (
              <ReservationBadge>Jóvenes</ReservationBadge>
            )}
            {reservedPlaces.women && (
              <ReservationBadge>Mujeres</ReservationBadge>
            )}
          </div>
        </div>
      )}
    </DetailSection>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[#E7EAF0] px-4 py-3 last:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-snug text-[#131A2C]">
        {value}
      </p>
    </div>
  );
}

function ReservationBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[#DDE1E8] bg-[#F4F6F9] px-3 text-xs font-medium text-[#4E5870]">
      {children}
    </span>
  );
}
