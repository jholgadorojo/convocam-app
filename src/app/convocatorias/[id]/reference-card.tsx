import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";

/** Identificadores de la convocatoria: CIDO, expediente, oferta y ámbito. */
export function ReferenceCard({
  selectionProcess,
}: {
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    "cidoIdentifier" | "fileNumber" | "publicOfferYear" | "scope"
  >;
}) {
  return (
    <section className="rounded-xl border border-[#E3E7EE] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#646E85]">
        Referencia
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <ReferenceItem
          label="Identificador CIDO"
          value={selectionProcess.cidoIdentifier}
        />
        {selectionProcess.fileNumber && (
          <ReferenceItem label="Expediente" value={selectionProcess.fileNumber} />
        )}
        {selectionProcess.publicOfferYear !== null && (
          <ReferenceItem
            label="Año de oferta pública"
            value={String(selectionProcess.publicOfferYear)}
          />
        )}
        <ReferenceItem
          label="Ámbito"
          value={selectionProcess.scope || "No especificado"}
        />
      </div>
    </section>
  );
}

function ReferenceItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#646E85]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[#4E5870]">
        {value}
      </p>
    </div>
  );
}
