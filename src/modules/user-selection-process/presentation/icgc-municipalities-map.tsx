"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  Popup as MapLibrePopup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Mapa cartografico de Convoca'm.
 *
 * Utiliza MapLibre GL JS y el mapa base simplificado oficial del ICGC.
 * Es un componente exclusivamente visual: no accede a la base de datos,
 * no conoce los filtros del usuario y no modifica ninguna convocatoria.
 *
 * El componente servidor que lo utilice le pasara los municipios ya
 * agrupados, el enlace de filtrado y si un marcador esta seleccionado.
 *
 * Este archivo puede crearse sin sustituir el mapa SVG existente.
 */
const ICGC_STYLE_URL =
  "https://geoserveis.icgc.cat/styles/mapa-base-simplificat.json";

// Limites aproximados para encuadrar toda Catalunya al abrir el mapa.
const CATALONIA_BOUNDS: [[number, number], [number, number]] = [
  [0.05, 40.45],
  [3.45, 42.95],
];

const CATALONIA_COORDINATE_LIMITS = {
  minLatitude: 40.4,
  maxLatitude: 43.0,
  minLongitude: 0,
  maxLongitude: 3.5,
};

const SELECTED_MUNICIPALITY_ZOOM = 11.5;
const MAP_LOAD_TIMEOUT_MS = 15000;

/** Devuelve el motivo real de un error sin perder los mensajes de MapLibre. */
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

export type IcgcMunicipalityMarker = {
  municipality: string;
  province: string;
  latitude: number;
  longitude: number;
  count: number;
  /** Enlace relativo, calculado por el componente servidor. */
  href: string;
  selected: boolean;
};

type Props = {
  markers: readonly IcgcMunicipalityMarker[];
  mode: "followed" | "for-me";
  /** Altura en pixeles del area cartografica. */
  height?: number;
  className?: string;
};

function hasValidCoordinates(marker: IcgcMunicipalityMarker): boolean {
  return (
    Boolean(marker.municipality.trim()) &&
    Number.isFinite(marker.count) &&
    marker.count > 0 &&
    Number.isFinite(marker.latitude) &&
    Number.isFinite(marker.longitude) &&
    marker.latitude >= CATALONIA_COORDINATE_LIMITS.minLatitude &&
    marker.latitude <= CATALONIA_COORDINATE_LIMITS.maxLatitude &&
    marker.longitude >= CATALONIA_COORDINATE_LIMITS.minLongitude &&
    marker.longitude <= CATALONIA_COORDINATE_LIMITS.maxLongitude
  );
}

function markerDescription(
  marker: IcgcMunicipalityMarker,
  mode: Props["mode"],
): string {
  const noun = marker.count === 1 ? "convocatoria" : "convocatorias";
  const qualifier = mode === "for-me" ? "recomendadas" : "seguidas";
  return `${marker.municipality}: ${marker.count} ${noun} ${qualifier}`;
}

export function IcgcMunicipalitiesMap({
  markers,
  mode,
  height = 400,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState("Preparando el mapa…");

  // El diagnostico diferencia tres problemas: WebGL2, recursos del mapa
  // y tiempo de carga. No cambia la seleccion ni el filtrado de municipios.
  useEffect(() => {
    let cancelled = false;
    let createdMap: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let styleReady = false;

    async function createMap() {
      try {
        // MapLibre 6 necesita WebGL2. En algunos equipos Linux, Chrome
        // puede bloquearlo por la configuracion grafica del navegador.
        const testCanvas = document.createElement("canvas");
        let webgl2Available = false;
        try {
          webgl2Available = testCanvas.getContext("webgl2") !== null;
        } catch {
          webgl2Available = false;
        }

        if (!webgl2Available) {
          setLoadError(
            "El navegador no puede iniciar WebGL2, necesario para MapLibre. " +
              "Comprueba la aceleración gráfica en Chrome (chrome://gpu).",
          );
          return;
        }

        setLoadingStage("Iniciando MapLibre…");
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        // MapLibre 6 necesita los archivos worker y shared juntos.
        // Se conservan las rutas locales configuradas en el paso anterior.
        maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

        setLoadingStage("Solicitando la cartografía del ICGC…");
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: ICGC_STYLE_URL,
          center: [1.75, 41.7],
          zoom: 6,
          minZoom: 4,
          maxZoom: 18,
          dragRotate: false,
          pitchWithRotate: false,
        });
        createdMap = map;
        mapRef.current = map;

        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right",
        );

        const markReady = () => {
          if (cancelled) return;
          styleReady = true;
          map.resize();
          setIsReady(true);
          // No borramos errores de teselas que hayan podido notificarse:
          // el usuario necesita conocerlos para diagnosticar el mapa.
        };

        // style.load indica que el estilo ya se ha recibido; load puede
        // demorarse por una tesela. Basta el estilo para situar marcadores.
        map.on("style.load", markReady);
        map.on("load", markReady);

        map.on("error", (event) => {
          const detail = errorMessage(event.error);
          console.error("[Convoca'm / ICGC] MapLibre:", event.error);
          if (!cancelled) {
            setLoadError(`Error de MapLibre: ${detail}`);
          }
        });

        map.on("webglcontextlost", () => {
          if (!cancelled) {
            setLoadError("Se ha perdido la conexión con WebGL2 del navegador.");
          }
        });

        // En cambios de columnas o tamaños responsive, el canvas debe
        // adaptarse al ancho real de su contenedor.
        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            if (!cancelled) map.resize();
          });
          resizeObserver.observe(containerRef.current);
        }

        timeoutId = setTimeout(() => {
          if (cancelled || styleReady) return;
          const rect = containerRef.current?.getBoundingClientRect();
          const sizeHint =
            rect && (rect.width < 10 || rect.height < 10)
              ? ` El contenedor mide ${Math.round(rect.width)} × ${Math.round(rect.height)} píxeles.`
              : "";
          setLoadError((previousError) =>
            previousError ??
              ("MapLibre no ha terminado de cargar el estilo del ICGC " +
                `tras 15 segundos.${sizeHint} Abre F12 > Red/Network para ` +
                "comprobar si el estilo, las teselas o el worker fallan."),
          );
        }, MAP_LOAD_TIMEOUT_MS);
      } catch (error) {
        console.error("[Convoca'm / ICGC] Error de inicialización:", error);
        if (!cancelled) {
          setLoadError(`No se ha podido iniciar el mapa: ${errorMessage(error)}`);
        }
      }
    }

    void createMap();

    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      resizeObserver?.disconnect();
      if (createdMap) {
        createdMap.remove();
        if (mapRef.current === createdMap) mapRef.current = null;
      }
    };
  }, []);

  // Los marcadores se dibujan solo cuando el estilo del mapa esta listo.
  // Son enlaces normales para conservar navegacion, filtros y accesibilidad.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;

    // Captura una referencia no nula para el render asíncrono y sus eventos.
    const activeMap: MapLibreMap = map;

    let disposed = false;
    const createdMarkers: MapLibreMarker[] = [];
    const createdPopups: MapLibrePopup[] = [];

    async function renderMarkers() {
      const maplibregl = await import("maplibre-gl");
      if (disposed) return;

      for (const marker of markers) {
        if (!hasValidCoordinates(marker)) continue;

        const coordinates: [number, number] = [
          marker.longitude,
          marker.latitude,
        ];
        const description = markerDescription(marker, mode);
        const link = document.createElement("a");
        link.href =
          marker.href.startsWith("/") && !marker.href.startsWith("//")
            ? marker.href
            : "#";
        link.title = description;
        link.setAttribute("aria-label", description);
        if (marker.selected) link.setAttribute("aria-current", "true");

        // El marcador conserva un tamano constante en pantalla, incluso
        // al acercar mucho el mapa: MapLibre reposiciona el elemento HTML.
        const size = marker.count >= 100 ? 38 : 34;
        link.style.width = `${size}px`;
        link.style.height = `${size}px`;
        link.style.display = "flex";
        link.style.alignItems = "center";
        link.style.justifyContent = "center";
        link.style.borderRadius = "9999px";
        link.style.border = marker.selected
          ? "3px solid #172554"
          : "2px solid #FFFFFF";
        link.style.backgroundColor = marker.selected ? "#25358F" : "#4F5BD5";
        link.style.color = "#FFFFFF";
        link.style.fontSize = marker.count >= 100 ? "12px" : "13px";
        link.style.fontWeight = "700";
        link.style.textDecoration = "none";
        link.style.boxShadow = marker.selected
          ? "0 0 0 5px rgba(79, 91, 213, 0.20), 0 2px 8px rgba(0,0,0,0.24)"
          : "0 2px 8px rgba(0,0,0,0.24)";
        link.style.cursor = "pointer";
        link.style.outlineOffset = "3px";
        link.textContent = String(marker.count);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 23,
        }).setText(description);

        const showPopup = () => {
          popup.setLngLat(coordinates).addTo(activeMap);
        };
        const hidePopup = () => popup.remove();
        link.addEventListener("mouseenter", showPopup);
        link.addEventListener("mouseleave", hidePopup);
        link.addEventListener("focus", showPopup);
        link.addEventListener("blur", hidePopup);

        const mapMarker = new maplibregl.Marker({
          element: link,
          anchor: "center",
        })
          .setLngLat(coordinates)
          .addTo(activeMap);

        createdMarkers.push(mapMarker);
        createdPopups.push(popup);
      }
    }

    void renderMarkers();

    return () => {
      disposed = true;
      for (const popup of createdPopups) popup.remove();
      for (const marker of createdMarkers) marker.remove();
    };
  }, [isReady, markers, mode]);

  const selectedMarker = markers.find(
    (marker) => marker.selected && hasValidCoordinates(marker),
  );
  const selectedLatitude = selectedMarker?.latitude;
  const selectedLongitude = selectedMarker?.longitude;

  // Cambiar el filtro de municipio centra la vista. Al quitar el filtro,
  // recuperamos Catalunya completa. Un movimiento manual no toca la URL.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;

    if (selectedLatitude !== undefined && selectedLongitude !== undefined) {
      map.flyTo({
        center: [selectedLongitude, selectedLatitude],
        zoom: SELECTED_MUNICIPALITY_ZOOM,
        duration: 600,
      });
    } else {
      map.fitBounds(CATALONIA_BOUNDS, {
        padding: 28,
        maxZoom: 8,
        duration: 600,
      });
    }
  }, [isReady, selectedLatitude, selectedLongitude]);

  const resetMapView = useCallback(() => {
    mapRef.current?.fitBounds(CATALONIA_BOUNDS, {
      padding: 28,
      maxZoom: 8,
      duration: 600,
    });
  }, []);

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-lg bg-[#F4F7FA]"
        style={{ height: Math.max(280, height) }}
        role="region"
        aria-label="Mapa interactivo de Catalunya con convocatorias por municipio"
      >
        {/* MapLibre fuerza position: relative en .maplibregl-map (CSS sin
            capa, que gana a las utilidades de Tailwind 4), por lo que
            absolute inset-0 no se aplica: el tamano debe ser h-full w-full. */}
        <div ref={containerRef} className="h-full w-full" />

        {isReady && (
          <button
            type="button"
            onClick={resetMapView}
            className="absolute left-3 top-3 z-10 rounded-md border border-[#DDE3EB] bg-white px-3 py-2 text-xs font-semibold text-[#25314A] shadow-sm hover:bg-[#F5F7FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
            title="Centrar el mapa en Catalunya sin modificar los filtros"
          >
            Ver toda Catalunya
          </button>
        )}

        {!isReady && !loadError && (
          <div
            role="status"
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#F4F7FA] px-4 text-center text-sm text-[#69738A]"
          >
            {loadingStage}
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className={
              isReady
                ? "absolute bottom-3 left-3 right-3 z-20 max-h-28 overflow-y-auto rounded-md border border-amber-300 bg-white/95 px-3 py-2 text-xs text-[#734F00] shadow-sm"
                : "absolute inset-0 z-20 flex items-center justify-center bg-white px-5 text-center text-sm text-[#734F00]"
            }
          >
            {loadError}
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-[#8A93A7]">
        Cartografía: {" "}
        <a
          href="https://www.icgc.cat/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[#4F5BD5]"
        >
          ICGC
        </a>
        . Ubicaciones aproximadas según el organismo convocante.
      </p>
    </div>
  );
}
