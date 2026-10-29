"use client";

import { useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";

import {
  AppNavigation,
  type AppNavigationItem,
} from "@/components/layout/app-navigation";

/**
 * Menú de la aplicación en pantallas estrechas (por debajo de `lg`,
 * donde se oculta AppSidebar): un botón en la cabecera que abre el
 * mismo menú en un panel lateral.
 */
export function MobileNavigation({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const activeItem = getActiveItem(usePathname());

  // Al elegir un enlace se navega con el panel abierto: se cierra a mano.
  function closeOnLinkClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) {
      setOpen(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Abrir menú"
        className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#131A2C] hover:bg-[#F4F6F9] lg:hidden"
      >
        <Menu size={22} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[#0E1A33]/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[264px] max-w-[85vw] flex-col overflow-y-auto bg-[#0E1A33] px-[14px] pb-5 pt-[18px] outline-none transition-transform duration-200 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full lg:hidden">
          <Dialog.Title className="sr-only">Menú de Convoca&apos;m</Dialog.Title>
          <Dialog.Close
            aria-label="Cerrar menú"
            className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-[#AEB8CE] hover:bg-[#1B2A4D]"
          >
            <X size={20} />
          </Dialog.Close>

          <div className="flex flex-1 flex-col" onClick={closeOnLinkClick}>
            <AppNavigation
              isAuthenticated={isAuthenticated}
              activeItem={activeItem}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Sección activa según la URL. */
function getActiveItem(pathname: string): AppNavigationItem | undefined {
  const sections: [string, AppNavigationItem][] = [
    ["/dashboard", "dashboard"],
    ["/convocatorias", "convocatorias"],
    ["/para-mi", "para-mi"],
    ["/mis-convocatorias", "mis-convocatorias"],
    ["/mi-perfil", "perfil"],
  ];
  return sections.find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`),
  )?.[1];
}
