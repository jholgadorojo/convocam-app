"use client";

import {
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

/**
 * Controles de zoom y desplazamiento para el SVG del mapa.
 *
 * El SVG se recibe como children desde un componente de servidor.
 * No se modifican los enlaces de los marcadores ni la cartografia.
 */
const ZOOM_LEVELS = [1, 1.5, 2, 3] as const;

type Position = {
  x: number;
  y: number;
};

type DragPosition = {
  pointerId: number;
  clientX: number;
  clientY: number;
};

type Props = {
  children: ReactNode;
};

function clampPosition(
  position: Position,
  zoom: number,
  container: HTMLDivElement | null,
): Position {
  if (!container || zoom <= 1) {
    return { x: 0, y: 0 };
  }

  const { width, height } = container.getBoundingClientRect();
  const maxX = (width * (zoom - 1)) / 2;
  const maxY = (height * (zoom - 1)) / 2;

  return {
    x: Math.max(-maxX, Math.min(maxX, position.x)),
    y: Math.max(-maxY, Math.min(maxY, position.y)),
  };
}

export function FollowedMunicipalitiesMapZoom({ children }: Props) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragPosition | null>(null);

  const zoom = ZOOM_LEVELS[zoomIndex] ?? 1;
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;
  const canZoomOut = zoomIndex > 0;

  function setZoom(nextIndex: number) {
    const index = Math.max(
      0,
      Math.min(ZOOM_LEVELS.length - 1, nextIndex),
    );
    const nextZoom = ZOOM_LEVELS[index] ?? 1;

    setPosition((current) =>
      clampPosition(current, nextZoom, viewportRef.current),
    );
    setZoomIndex(index);
  }

  function resetView() {
    dragRef.current = null;
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setZoomIndex(0);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1 || event.button !== 0) {
      return;
    }

    // Los marcadores deben seguir siendo enlaces pulsables.
    if (
      event.target instanceof Element &&
      event.target.closest("a, button")
    ) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.clientX;
    const deltaY = event.clientY - drag.clientY;

    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };

    setPosition((current) =>
      clampPosition(
        { x: current.x + deltaX, y: current.y + deltaY },
        zoom,
        viewportRef.current,
      ),
    );
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

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
      >
        <div
          className={isDragging ? "" : "transition-transform duration-150"}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setZoom(zoomIndex + 1)}
          disabled={!canZoomIn}
          aria-label="Ampliar mapa"
          title="Ampliar mapa"
          className={controlClassName}
        >
          <Plus size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setZoom(zoomIndex - 1)}
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
          aria-label="Restablecer vista del mapa"
          title="Restablecer vista"
          className={controlClassName}
        >
          <Maximize2 size={17} aria-hidden="true" />
        </button>
      </div>

      <span className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-[#69738A] shadow-sm">
        {zoom === 1 ? "Vista completa" : `Zoom ${zoom}x`}
      </span>
    </div>
  );
}
