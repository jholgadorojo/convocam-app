"use client";

import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  async function handleLogout() {
    await authClient.signOut();

    // Recarga completa a propósito: descarta la caché del router y el estado
    // del cliente de la sesión anterior.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/dashboard");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
    >
      <LogOut size={18} className="text-[#7D89A6]" />

      Cerrar sesión
    </button>
  );
}