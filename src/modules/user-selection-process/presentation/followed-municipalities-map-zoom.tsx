"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

/**
 * Navegacion reutilizable del mapa de Catalunya.
 *
 * - Zoom con botones, rueda y doble clic.
 * - Arrastre para desplazar la vista ampliada.
 * - Punto de enfoque opcional, expresado en coordenadas del SVG (620 x 500).
 * - No modifica la cartografia ni los enlaces de los marcadores.
 *
 * El punto de enfoque se conectara desde FollowedMunicipalitiesMap en el
 * siguiente paso, cuando conozcamos la posicion del municipio seleccionado.
 */
const ZOOM_LEVELS = [1, 1.5, 2, 3, 4, 6, 8, 12] as const;
const FOCUSED_ZOOM = 8;
const SVG_WIDTH = 620;
const SVG_HEIGHT = 500;
const WHEEL_THRESHOLD = 80;

type Position = { x: number; y: number };
type ViewState = { zoomIndex: number; position: Position };
type DragPosition = { pointerId: number; clientX: number; clientY: number };

type Props = {
  children: ReactNode;
  /** Punto en el viewBox del mapa; null restablece la vista completa. */
  focusPoint?: Position | null;
};

const INITIAL_VIEW: ViewState = {
  zoomIndex: 0,
  position: { x: 0, y: 0 },
};

function zoomLevel(index: number): number {
  return ZOOM_LEVELS[index] ?? 1;
}

function clampIndex(index: number): number {
  return Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index));
}

function clampPosition(
  position: Position,
  zoom: number,
  viewport: HTMLDivElement | null,
): Position {
  if (!viewport || zoom <= 1) return { x: 0, y: 0 };

  const { width, height } = viewport.getBoundingClientRect();
  const maxX = (width * (zoom - 1)) / 2;
  const maxY = (height * (zoom - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, position.x)),
    y: Math.max(-maxY, Math.min(maxY, position.y)),
  };
}

/** Conserva bajo el cursor el punto geografico al acercar o alejar. */
function zoomAround(
  current: ViewState,
  nextIndex: number,
  anchor: Position,
  viewport: HTMLDivElement | null,
): ViewState {
  const index = clampIndex(nextIndex);
  if (index === current.zoomIndex) return current;
  const before = zoomLevel(current.zoomIndex);
  const after = zoomLevel(index);
  const ratio = after / before;

  return {
    zoomIndex: index,
    position: clampPosition(
      {
        x: anchor.x - (anchor.x - current.position.x) * ratio,
        y: anchor.y - (anchor.y - current.position.y) * ratio,
      },
      after,
      viewport,
    ),
  };
}

function anchorFromClientPoint(
  clientX: number,
  clientY: number,
  viewport: HTMLDivElement,
): Position {
  const rect = viewport.getBoundingClientRect();
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  };
}

function centeredOnPoint(
  point: Position,
  viewport: HTMLDivElement | null,
): ViewState {
  if (
    !viewport ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 || point.x > SVG_WIDTH ||
    point.y < 0 || point.y > SVG_HEIGHT
  ) {
    return INITIAL_VIEW;
  }

  const rect = viewport.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return INITIAL_VIEW;

  const index = ZOOM_LEVELS.indexOf(FOCUSED_ZOOM);
  const targetIndex = index >= 0 ? index : ZOOM_LEVELS.length - 1;
  const zoom = zoomLevel(targetIndex);
  const offsetX = (point.x / SVG_WIDTH - 0.5) * rect.width;
  const offsetY = (point.y / SVG_HEIGHT - 0.5) * rect.height;

  return {
    zoomIndex: targetIndex,
    position: clampPosition(
      { x: -offsetX * zoom, y: -offsetY * zoom },
      zoom,
      viewport,
    ),
  };
}

export function FollowedMunicipalitiesMapZoom({
  children,
  focusPoint = null,
}: Props) {
  const [view, setView] = useState<ViewState>(INITIAL_VIEW);
  const [isDragging, setIsDragging] = useState(false);
  const viewRef = useRef<ViewState>(INITIAL_VIEW);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragPosition | null>(null);
  const wheelDeltaRef = useRef(0);

  // Mantener la vista sincronizada entre eventos consecutivos de la rueda.
  const updateView = useCallback(
    (compute: (current: ViewState) => ViewState) => {
      const next = compute(viewRef.current);
      viewRef.current = next;
      setView(next);
    },
    [],
  );

  const zoom = zoomLevel(view.zoomIndex);
  const canZoomIn = view.zoomIndex < ZOOM_LEVELS.length - 1;
  const canZoomOut = view.zoomIndex > 0;

  // La pagina que utiliza el mapa puede pedir enfocarlo en un municipio.
  // Al quitar el municipio vuelve a mostrarse toda Catalunya.
  const focusX = focusPoint?.x;
  const focusY = focusPoint?.y;
  useEffect(() => {
    dragRef.current = null;
    setIsDragging(false);
    wheelDeltaRef.current = 0;
    if (focusX === undefined || focusY === undefined) {
      updateView(() => INITIAL_VIEW);
      return;
    }
    updateView(() => centeredOnPoint(
      { x: focusX, y: focusY },
      viewportRef.current,
    ));
  }, [focusX, focusY, updateView]);

  // Registro nativo no pasivo: permite controlar la rueda sin que la pagina
  // se desplace al hacer zoom. En los limites, la pagina puede seguir bajando.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function handleWheel(event: WheelEvent) {
      if (!viewport || event.deltaY === 0) return;

      const direction = event.deltaY < 0 ? 1 : -1;
      const index = viewRef.current.zoomIndex;
      if (clampIndex(index + direction) === index) {
        wheelDeltaRef.current = 0;
        return;
      }

      event.preventDefault();
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      const delta = event.deltaY * factor;
      if (Math.sign(delta) !== Math.sign(wheelDeltaRef.current)) {
        wheelDeltaRef.current = 0;
      }
      wheelDeltaRef.current += delta;
      if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) return;

      const steps = Math.min(2, Math.floor(Math.abs(wheelDeltaRef.current) / WHEEL_THRESHOLD));
      wheelDeltaRef.current = 0;
      const anchor = anchorFromClientPoint(event.clientX, event.clientY, viewport);
      updateView((current) => zoomAround(
        current,
        current.zoomIndex + direction * steps,
        anchor,
        viewport,
      ));
    }

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [updateView]);

  // Mantener el mismo lugar visible al cambiar el ancho del panel o de pantalla.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    let lastWidth = viewport.getBoundingClientRect().width;
    let lastHeight = viewport.getBoundingClientRect().height;

    const observer = new ResizeObserver(() => {
      const rect = viewport.getBoundingClientRect();
      if (lastWidth > 0 && lastHeight > 0 && rect.width > 0 && rect.height > 0) {
        const ratioX = rect.width / lastWidth;
        const ratioY = rect.height / lastHeight;
        if (ratioX !== 1 || ratioY !== 1) {
          updateView((current) => ({
            ...current,
            position: clampPosition(
              { x: current.position.x * ratioX, y: current.position.y * ratioY },
              zoomLevel(current.zoomIndex),
              viewport,
            ),
          }));
        }
      }
      lastWidth = rect.width;
      lastHeight = rect.height;
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [updateView]);

  function changeZoom(direction: number, anchor: Position = { x: 0, y: 0 }) {
    updateView((current) => zoomAround(
      current,
      current.zoomIndex + direction,
      anchor,
      viewportRef.current,
    ));
  }

  function resetView() {
    dragRef.current = null;
    wheelDeltaRef.current = 0;
    setIsDragging(false);
    updateView(() => INITIAL_VIEW);
  }

  function handleDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (
      event.target instanceof Element &&
      event.target.closest("a, button")
    ) return;
    if (!canZoomIn) return;
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    changeZoom(2, anchorFromClientPoint(event.clientX, event.clientY, viewport));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (viewRef.current.zoomIndex === 0 || event.button !== 0) return;
    // Los marcadores siguen siendo enlaces: nunca iniciar arrastre sobre ellos.
    if (event.target instanceof Element && event.target.closest("a, button")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.clientX;
    const deltaY = event.clientY - drag.clientY;
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    updateView((current) => ({
      ...current,
      position: clampPosition(
        {
          x: current.position.x + deltaX,
          y: current.position.y + deltaY,
        },
        zoomLevel(current.zoomIndex),
        viewportRef.current,
      ),
    }));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const controlClassName =
    "flex h-9 w-9 items-center justify-center rounded-md " +
    "border border-[#D5DAE3] bg-white text-[#283659] shadow-sm " +
    "hover:bg-[#EEF0FC] focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5] " +
    "disabled:cursor-not-allowed disabled:opacity-40";

  const contentStyle = {
    transform: `translate(${view.position.x}px, ${view.position.y}px) scale(${zoom})`,
    transformOrigin: "center center",
    // El siguiente paso usara esta variable para mantener legible el marcador.
    "--map-marker-inverse-zoom": String(1 / zoom),
  } as CSSProperties;

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#E7EAF0] bg-[#F9FBFF]">
      <div
        ref={viewportRef}
        className={`relative overflow-hidden select-none ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
        style={{ touchAction: zoom > 1 ? "none" : "auto" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          dragRef.current = null;
          setIsDragging(false);
        }}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className={isDragging ? "" : "transition-transform duration-150"}
          style={contentStyle}
        >
          {children}
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => changeZoom(1)}
          disabled={!canZoomIn}
          aria-label="Ampliar mapa"
          title="Ampliar mapa"
          className={controlClassName}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => changeZoom(-1)}
          disabled={!canZoomOut}
          aria-label="Reducir mapa"
          title="Reducir mapa"
          className={controlClassName}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={resetView}
          disabled={!canZoomOut}
          aria-label="Ver toda Catalunya"
          title="Ver toda Catalunya"
          className={controlClassName}
        >
          <Maximize2 size={17} aria-hidden="true" />
        </button>
      </div>

      <span className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-[#69738A] shadow-sm">
        {zoom === 1 ? "Toda Catalunya" : `Zoom ${zoom}x`}
      </span>
    </div>
  );
}
