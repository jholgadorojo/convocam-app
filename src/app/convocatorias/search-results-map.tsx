import { MapPin } from "lucide-react";
import {
  IcgcMunicipalitiesMap,
  type IcgcMunicipalityMarker,
} from "@/modules/user-selection-process/presentation/icgc-municipalities-map";

/**
 * Vista de mapa del buscador: municipios con convocatorias que
 * coinciden con la búsqueda, o un aviso si no hay ninguno.
 */
export function SearchResultsMap({
  markers,
  totalItems,
}: {
  markers: readonly IcgcMunicipalityMarker[];
  totalItems: number;
}) {
  const mappedCount = markers.reduce((total, marker) => total + marker.count, 0);

  return (
    <div className="rounded-xl border border-[#E3E7EE] bg-white p-4 shadow-sm">
      {markers.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-[#4E5870]">
            Selecciona un municipio para ver sus convocatorias en el listado.
            Puedes ampliar el mapa y acercarte a los marcadores agrupados.
          </p>
          <IcgcMunicipalitiesMap markers={markers} mode="search" height={580} />
          {mappedCount < totalItems && (
            <p className="mt-3 text-xs leading-relaxed text-[#69738A]">
              {totalItems - mappedCount} convocatorias coincidentes no tienen
              ubicación municipal representable en el mapa; siguen disponibles en el listado.
            </p>
          )}
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <MapPin size={28} className="text-[#7C859B]" aria-hidden="true" />
          <p className="text-base font-semibold text-[#131A2C]">
            {totalItems === 0
              ? "No se han encontrado convocatorias"
              : "No hay municipios con coordenadas disponibles"}
          </p>
          <p className="max-w-lg text-sm text-[#69738A]">
            {totalItems === 0
              ? "Prueba con otros criterios de búsqueda."
              : "Las convocatorias encontradas siguen disponibles en el listado."}
          </p>
        </div>
      )}
    </div>
  );
}
