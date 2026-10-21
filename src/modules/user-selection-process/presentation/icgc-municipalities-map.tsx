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
// Distancia maxima entre marcadores para agruparlos en pantalla.
// Al cambiar el zoom, la agrupacion se recalcula automaticamente.
const MARKER_GROUP_DISTANCE_PX = 56;
const MARKER_VISIBILITY_MARGIN_PX = 90;
const GROUP_ZOOM_INCREMENT = 2;

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

type ProjectedMunicipality = {
  marker: IcgcMunicipalityMarker;
  x: number;
  y: number;
};

/**
 * Agrupa municipios solo cuando sus marcadores se pisan visualmente.
 * La distancia se mide en pixeles, no en kilometros: al acercar el mapa
 * los grupos se separan de forma natural, sin modificar los datos.
 *
 * La cuadricula espacial evita comparar todos los pares de municipios.
 */
function groupNearbyMunicipalities(
  points: readonly ProjectedMunicipality[],
): ProjectedMunicipality[][] {
  const parents = points.map((_, index) => index);
  const cells = new Map<string, number[]>();
  const distanceSquared = MARKER_GROUP_DISTANCE_PX ** 2;

  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const next = parents[index];
      parents[index] = root;
      index = next;
    }
    return root;
  };

  const unite = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };

  points.forEach((point, index) => {
    const cellX = Math.floor(point.x / MARKER_GROUP_DISTANCE_PX);
    const cellY = Math.floor(point.y / MARKER_GROUP_DISTANCE_PX);

    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const candidates = cells.get(`${cellX + offsetX}:${cellY + offsetY}`);
        if (!candidates) continue;

        for (const candidateIndex of candidates) {
          const candidate = points[candidateIndex];
          const deltaX = point.x - candidate.x;
          const deltaY = point.y - candidate.y;
          if (deltaX * deltaX + deltaY * deltaY < distanceSquared) {
            unite(index, candidateIndex);
          }
        }
      }
    }

    const cellKey = `${cellX}:${cellY}`;
    const current = cells.get(cellKey);
    if (current) current.push(index);
    else cells.set(cellKey, [index]);
  });

  const groups = new Map<number, ProjectedMunicipality[]>();
  points.forEach((point, index) => {
    const root = find(index);
    const existing = groups.get(root);
    if (existing) existing.push(point);
    else groups.set(root, [point]);
  });
  return Array.from(groups.values());
}

/** Los enlaces siempre son internos, como en el componente anterior. */
function safeMarkerHref(marker: IcgcMunicipalityMarker): string {
  return marker.href.startsWith("/") && !marker.href.startsWith("//")
    ? marker.href
    : "#";
}

/** Una cifra corta cabe en los circulos; el total exacto sigue en el tooltip. */
function markerCountLabel(count: number): string {
  return count > 999 ? "999+" : String(count);
}

export function IcgcMunicipalitiesMap({
  markers,
  mode,
  height = 400,
  className = "",
}: Props) {
  // El elemento de MapLibre se crea fuera del arbol de React para moverlo
  // entre la vista normal y el dialogo sin destruir el mapa ni sus marcadores.
  const inlineMapSlotRef = useRef<HTMLDivElement>(null);
  const expandedMapSlotRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState("Preparando el mapa…");
  const [isExpanded, setIsExpanded] = useState(false);

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
        if (cancelled || !inlineMapSlotRef.current) return;

        const mapElement = document.createElement("div");
        // Mantiene el ajuste que evita que el mapa quede en blanco con
        // las reglas CSS de MapLibre y Tailwind 4.
        mapElement.className = "h-full w-full";
        inlineMapSlotRef.current.appendChild(mapElement);
        mapElementRef.current = mapElement;

        // MapLibre 6 necesita los archivos worker y shared juntos.
        // Se conservan las rutas locales configuradas en el paso anterior.
        maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

        setLoadingStage("Solicitando la cartografía del ICGC…");
        const map = new maplibregl.Map({
          container: mapElement,
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
          resizeObserver.observe(mapElement);
        }

        timeoutId = setTimeout(() => {
          if (cancelled || styleReady) return;
          const rect = mapElementRef.current?.getBoundingClientRect();
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
      mapElementRef.current?.remove();
      mapElementRef.current = null;
    };
  }, []);

  // Los marcadores se agrupan segun su proximidad en pantalla. No hay
  // agrupaciones guardadas en la base de datos: solo cambia la presentacion.
  // Un marcador individual siempre mantiene su enlace de filtrado original.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;

    const activeMap: MapLibreMap = map;
    let disposed = false;
    let detachEvents: (() => void) | null = null;
    let displayedMarkers: MapLibreMarker[] = [];
    let displayedPopups: MapLibrePopup[] = [];

    const clearMarkers = () => {
      for (const popup of displayedPopups) popup.remove();
      for (const marker of displayedMarkers) marker.remove();
      displayedMarkers = [];
      displayedPopups = [];
    };

    async function initializeMarkers() {
      const maplibregl = await import("maplibre-gl");
      if (disposed) return;

      const redrawMarkers = () => {
        if (disposed) return;

        const container = activeMap.getContainer();
        const width = container.clientWidth;
        const height = container.clientHeight;
        // Al mover el mismo mapa al dialogo hay un instante sin dimensiones.
        if (width < 10 || height < 10) return;

        const visiblePoints: ProjectedMunicipality[] = [];
        for (const marker of markers) {
          if (!hasValidCoordinates(marker)) continue;
          const screenPoint = activeMap.project([
            marker.longitude,
            marker.latitude,
          ]);
          if (
            screenPoint.x < -MARKER_VISIBILITY_MARGIN_PX ||
            screenPoint.x > width + MARKER_VISIBILITY_MARGIN_PX ||
            screenPoint.y < -MARKER_VISIBILITY_MARGIN_PX ||
            screenPoint.y > height + MARKER_VISIBILITY_MARGIN_PX
          ) {
            continue;
          }
          visiblePoints.push({
            marker,
            x: screenPoint.x,
            y: screenPoint.y,
          });
        }

        const groups = groupNearbyMunicipalities(visiblePoints);
        clearMarkers();

        for (const group of groups) {
          if (group.length === 1) {
            const { marker } = group[0];
            const coordinates: [number, number] = [
              marker.longitude,
              marker.latitude,
            ];
            const description = markerDescription(marker, mode);
            const link = document.createElement("a");
            link.href = safeMarkerHref(marker);
            link.title = description;
            link.setAttribute("aria-label", description);
            if (marker.selected) link.setAttribute("aria-current", "true");

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
            link.textContent = markerCountLabel(marker.count);

            const popup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 23,
            }).setText(description);

            link.addEventListener("mouseenter", () => {
              popup.setLngLat(coordinates).addTo(activeMap);
            });
            link.addEventListener("mouseleave", () => popup.remove());
            link.addEventListener("focus", () => {
              popup.setLngLat(coordinates).addTo(activeMap);
            });
            link.addEventListener("blur", () => popup.remove());

            displayedMarkers.push(
              new maplibregl.Marker({ element: link, anchor: "center" })
                .setLngLat(coordinates)
                .addTo(activeMap),
            );
            displayedPopups.push(popup);
            continue;
          }

          // Varios municipios se encuentran demasiado cerca para mostrar
          // varios circulos independientes. Mostramos el total de convocatorias,
          // no solo el numero de municipios.
          const grouped = [...group].sort(
            (left, right) =>
              Number(right.marker.selected) - Number(left.marker.selected) ||
              right.marker.count - left.marker.count ||
              left.marker.municipality.localeCompare(
                right.marker.municipality,
                "es",
              ),
          );
          const total = grouped.reduce(
            (sum, point) => sum + point.marker.count,
            0,
          );
          const selected = grouped.some((point) => point.marker.selected);
          const centerX =
            grouped.reduce((sum, point) => sum + point.x, 0) / grouped.length;
          const centerY =
            grouped.reduce((sum, point) => sum + point.y, 0) / grouped.length;
          const center = activeMap.unproject([centerX, centerY]);
          const coordinates: [number, number] = [center.lng, center.lat];
          const noun = total === 1 ? "convocatoria" : "convocatorias";
          const description =
            `${grouped.length} municipios · ${total} ${noun} ` +
            (mode === "for-me" ? "recomendadas" : "seguidas");

          const button = document.createElement("button");
          button.type = "button";
          button.title = `${description}. Pulsa para acercar el mapa.`;
          button.setAttribute(
            "aria-label",
            `${description}. Acercar o elegir municipio.`,
          );
          button.style.position = "relative";
          button.style.width = "46px";
          button.style.height = "46px";
          button.style.display = "flex";
          button.style.alignItems = "center";
          button.style.justifyContent = "center";
          button.style.borderRadius = "9999px";
          button.style.border = selected
            ? "3px solid #172554"
            : "3px solid #FFFFFF";
          button.style.backgroundColor = selected ? "#25358F" : "#3847AD";
          button.style.color = "#FFFFFF";
          button.style.fontSize = "13px";
          button.style.fontWeight = "700";
          button.style.boxShadow = selected
            ? "0 0 0 5px rgba(79,91,213,0.24), 0 3px 10px rgba(0,0,0,0.28)"
            : "0 3px 10px rgba(0,0,0,0.24)";
          button.style.cursor = "zoom-in";
          button.style.outlineOffset = "3px";
          button.textContent = markerCountLabel(total);

          const municipalityBadge = document.createElement("span");
          municipalityBadge.textContent = `${grouped.length} mun.`;
          municipalityBadge.setAttribute("aria-hidden", "true");
          municipalityBadge.style.position = "absolute";
          municipalityBadge.style.top = "33px";
          municipalityBadge.style.left = "26px";
          municipalityBadge.style.whiteSpace = "nowrap";
          municipalityBadge.style.padding = "2px 5px";
          municipalityBadge.style.borderRadius = "9999px";
          municipalityBadge.style.border = "1px solid white";
          municipalityBadge.style.backgroundColor = "#E7ECFF";
          municipalityBadge.style.color = "#25358F";
          municipalityBadge.style.fontSize = "10px";
          municipalityBadge.style.fontWeight = "700";
          municipalityBadge.style.lineHeight = "1.3";
          button.appendChild(municipalityBadge);

          const summaryPopup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 30,
          }).setText(description);

          // Si varios municipios siguen superpuestos incluso al maximo zoom,
          // ofrecemos enlaces individuales para que ninguno quede inaccesible.
          const choices = document.createElement("div");
          choices.style.minWidth = "200px";
          choices.style.maxHeight = "250px";
          choices.style.overflowY = "auto";
          const heading = document.createElement("strong");
          heading.textContent = "Seleccionar municipio";
          heading.style.display = "block";
          heading.style.marginBottom = "8px";
          choices.appendChild(heading);
          for (const point of grouped) {
            const choice = document.createElement("a");
            choice.href = safeMarkerHref(point.marker);
            choice.textContent = markerDescription(point.marker, mode);
            choice.style.display = "block";
            choice.style.padding = "5px 0";
            choice.style.fontSize = "12px";
            choice.style.color = "#25358F";
            choice.style.textDecoration = "underline";
            if (point.marker.selected) {
              choice.setAttribute("aria-current", "true");
            }
            choices.appendChild(choice);
          }
          const choicesPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            offset: 32,
            maxWidth: "320px",
          }).setDOMContent(choices);

          button.addEventListener("mouseenter", () => {
            if (!choicesPopup.isOpen()) {
              summaryPopup.setLngLat(coordinates).addTo(activeMap);
            }
          });
          button.addEventListener("mouseleave", () => summaryPopup.remove());
          button.addEventListener("focus", () => {
            if (!choicesPopup.isOpen()) {
              summaryPopup.setLngLat(coordinates).addTo(activeMap);
            }
          });
          button.addEventListener("blur", () => summaryPopup.remove());
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            summaryPopup.remove();
            const nextZoom = Math.min(
              activeMap.getZoom() + GROUP_ZOOM_INCREMENT,
              activeMap.getMaxZoom(),
            );
            if (nextZoom > activeMap.getZoom() + 0.1) {
              activeMap.easeTo({
                center: coordinates,
                zoom: nextZoom,
                duration: 500,
              });
            } else {
              choicesPopup.setLngLat(coordinates).addTo(activeMap);
            }
          });

          displayedMarkers.push(
            new maplibregl.Marker({ element: button, anchor: "center" })
              .setLngLat(coordinates)
              .addTo(activeMap),
          );
          displayedPopups.push(summaryPopup, choicesPopup);
        }
      };

      redrawMarkers();
      activeMap.on("moveend", redrawMarkers);
      activeMap.on("resize", redrawMarkers);
      detachEvents = () => {
        activeMap.off("moveend", redrawMarkers);
        activeMap.off("resize", redrawMarkers);
      };
    }

    void initializeMarkers();

    return () => {
      disposed = true;
      detachEvents?.();
      clearMarkers();
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

  // El dialogo HTML nativo se muestra en la capa superior del navegador.
  // Movemos el MISMO elemento cartografico; React no lo gestiona directamente.
  const openExpandedMap = useCallback(() => {
    const dialog = dialogRef.current;
    const destination = expandedMapSlotRef.current;
    const mapElement = mapElementRef.current;
    if (!isReady || !dialog || !destination || !mapElement || dialog.open) return;

    try {
      dialog.showModal();
      destination.appendChild(mapElement);
      setIsExpanded(true);
      requestAnimationFrame(() => mapRef.current?.resize());
    } catch (error) {
      console.error("[Convoca'm / ICGC] No se pudo ampliar el mapa:", error);
      inlineMapSlotRef.current?.appendChild(mapElement);
      if (dialog.open) dialog.close();
    }
  }, [isReady]);

  const closeExpandedMap = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Se ejecuta tambien al pulsar Esc: devolvemos el mapa al panel original.
  const handleDialogClose = useCallback(() => {
    const mapElement = mapElementRef.current;
    if (mapElement && inlineMapSlotRef.current) {
      inlineMapSlotRef.current.appendChild(mapElement);
    }
    setIsExpanded(false);
    requestAnimationFrame(() => mapRef.current?.resize());
    expandButtonRef.current?.focus();
  }, []);

  // Impide que el documento se desplace detras del dialogo.
  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-lg bg-[#F4F7FA]"
        style={{ height: Math.max(280, height) }}
        role="region"
        aria-label="Mapa interactivo de Catalunya con convocatorias por municipio"
      >
        {/* Mantener h-full w-full: MapLibre tiene position: relative propia. */}
        <div ref={inlineMapSlotRef} className="h-full w-full" />

        {isReady && (
          <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%_-_4.5rem)] flex-col items-start gap-2">
            <button
              type="button"
              onClick={resetMapView}
              className="rounded-md border border-[#DDE3EB] bg-white px-3 py-2 text-xs font-semibold text-[#25314A] shadow-sm hover:bg-[#F5F7FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
              title="Centrar el mapa en Catalunya sin modificar los filtros"
            >
              Ver toda Catalunya
            </button>
            <button
              ref={expandButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isExpanded}
              onClick={openExpandedMap}
              className="rounded-md border border-[#DDE3EB] bg-white px-3 py-2 text-xs font-semibold text-[#25314A] shadow-sm hover:bg-[#F5F7FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
              title="Abrir una vista ampliada del mapa"
            >
              Ampliar mapa
            </button>
          </div>
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

      {/* El dialogo permanece montado, pero cerrado hasta pulsar el boton.
          No usamos display:flex en el propio dialogo: debe quedar oculto
          por las reglas nativas cuando no tiene el atributo open. */}
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        aria-label="Mapa ampliado de convocatorias de Catalunya"
        className="fixed inset-0 m-auto max-h-none max-w-none overflow-hidden rounded-xl border border-[#DDE3EB] bg-white p-0 shadow-2xl backdrop:bg-slate-950/65"
        style={{ width: "min(96vw, 1500px)", height: "90dvh" }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#DDE3EB] bg-white px-4 py-3">
            <h2 className="text-sm font-semibold text-[#25314A]">
              Mapa de convocatorias de Catalunya
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetMapView}
                className="rounded-md border border-[#DDE3EB] bg-white px-3 py-2 text-xs font-semibold text-[#25314A] hover:bg-[#F5F7FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
              >
                Ver toda Catalunya
              </button>
              <button
                type="button"
                onClick={closeExpandedMap}
                className="rounded-md bg-[#25358F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#172554] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5]"
              >
                Cerrar mapa
              </button>
            </div>
          </div>
          <div
            ref={expandedMapSlotRef}
            className="min-h-0 flex-1 bg-[#F4F7FA]"
            role="region"
            aria-label="Cartografía ampliada con convocatorias por municipio"
          />
          {loadError && (
            <div role="alert" className="shrink-0 border-t border-amber-300 bg-amber-50 px-4 py-2 text-xs text-[#734F00]">
              {loadError}
            </div>
          )}
          <p className="shrink-0 px-4 py-2 text-[11px] text-[#8A93A7]">
            Cartografía:{" "}
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
      </dialog>

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
