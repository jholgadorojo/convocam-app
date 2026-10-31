"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * Panel de filtros en pantallas estrechas (por debajo de `lg`): un
 * botón «Filtros» lo abre como hoja inferior sobre los resultados.
 * Desde `lg` el panel se ve en la columna lateral como siempre.
 *
 * No se usa el Dialog de base-ui porque desmonta su contenido al
 * cerrarse, y el formulario de filtros debe estar siempre en el DOM:
 * el buscador y la ordenación se envían con él mediante `form={...}`.
 * Por eso el panel solo se desplaza fuera de la pantalla.
 */

const PANEL_ID = "convocatorias-filters-panel";
const LG_MEDIA_QUERY = "(min-width: 64rem)";

type SheetState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SearchFiltersSheetContext = createContext<SheetState | null>(null);

function useSheet(): SheetState {
  const state = useContext(SearchFiltersSheetContext);
  if (!state) {
    throw new Error("Los controles del panel de filtros necesitan SearchFiltersSheet.");
  }
  return state;
}

/** Comparte el estado abierto/cerrado entre el botón y el panel. */
export function SearchFiltersSheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Con el panel abierto no se desplaza la página de fondo.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    // Si la ventana pasa a `lg`, el panel vuelve a la columna lateral.
    const largeScreen = window.matchMedia(LG_MEDIA_QUERY);
    function closeOnLargeScreen(event: MediaQueryListEvent) {
      if (event.matches) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    largeScreen.addEventListener("change", closeOnLargeScreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      largeScreen.removeEventListener("change", closeOnLargeScreen);
    };
  }, [open]);

  return (
    <SearchFiltersSheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SearchFiltersSheetContext.Provider>
  );
}

/** Botón «Filtros (n)», solo por debajo de `lg`. */
export function SearchFiltersSheetTrigger({
  activeFilterCount,
}: {
  activeFilterCount: number;
}) {
  const { open, setOpen } = useSheet();

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={PANEL_ID}
      onClick={() => setOpen(true)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#131A2C] shadow-sm hover:bg-[#F4F6F9] lg:hidden"
    >
      <SlidersHorizontal size={16} className="text-[#4E5870]" />
      Filtros
      {activeFilterCount > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#4F5BD5] px-1.5 text-xs font-semibold text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}

/** Contenedor del panel: hoja inferior en móvil, columna lateral en `lg`. */
export function SearchFiltersSheetPanel({ children }: { children: ReactNode }) {
  const { open, setOpen } = useSheet();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-[#0E1A33]/50 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        id={PANEL_ID}
        tabIndex={-1}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? "Filtros" : undefined}
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white outline-none transition-[transform,visibility] duration-200 lg:visible lg:static lg:z-auto lg:max-h-none lg:translate-y-0 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:transition-none ${
          open ? "visible translate-y-0" : "invisible translate-y-full"
        }`}
      >
        {children}
      </div>
    </>
  );
}

/** Botón ✕ de la cabecera del panel, solo por debajo de `lg`. */
export function SearchFiltersSheetClose() {
  const { setOpen } = useSheet();

  return (
    <button
      type="button"
      aria-label="Cerrar filtros"
      onClick={() => setOpen(false)}
      className="-mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-[#4E5870] hover:bg-[#F4F6F9] lg:hidden"
    >
      <X size={20} />
    </button>
  );
}
