import Link from "next/link";
import {
  Bookmark,
  LayoutDashboard,
  LogIn,
  Search,
  User,
  UserPlus,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";

type AppSidebarProps = {
  isAuthenticated: boolean;
  activeItem?: "dashboard" | "convocatorias" | "mis-convocatorias" | "perfil";
};

export function AppSidebar({
  isAuthenticated,
  activeItem = "dashboard",
}: AppSidebarProps) {
  return (
    <aside className="hidden sticky top-0 h-screen min-h-screen w-[264px] shrink-0 flex-col bg-[#0E1A33] px-[14px] pb-5 pt-[18px] lg:flex ">
      {/* Logo */}
      <div className="px-2 pb-[26px] pt-0.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#4F5BD5]">
            <span className="text-sm font-bold text-white">C</span>
          </div>

          <span className="text-lg font-bold text-white">
            Convoca&apos;m
          </span>
        </Link>
      </div>

      {/* Navegación principal */}
      <nav className="flex flex-col gap-0.5">
        <Link
          href="/dashboard"
          className={
            activeItem === "dashboard"
              ? "flex h-10 items-center gap-3 rounded-lg bg-[#1B2A4D] px-3 text-sm font-semibold text-white"
              : "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
          }
        >
          <LayoutDashboard
            size={18}
            className="text-[#A9B1FF]"
          />

          Dashboard
        </Link>

        <Link
          href="/convocatorias"
          className={
            activeItem === "convocatorias"
              ? "flex h-10 items-center gap-3 rounded-lg bg-[#1B2A4D] px-3 text-sm font-semibold text-white"
              : "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
          }
        >
          <Search size={18} className="text-[#7D89A6]" />

          Buscar convocatorias
        </Link>

        <Link
          href={
            isAuthenticated
              ? "/mis-convocatorias"
              : "/login?returnTo=/mis-convocatorias"
          }
          className={
            activeItem === "mis-convocatorias"
              ? "flex h-10 items-center gap-3 rounded-lg bg-[#1B2A4D] px-3 text-sm font-semibold text-white"
              : "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
          }
        >
          <Bookmark size={18} className="text-[#7D89A6]" />

          Mis convocatorias
        </Link>
      </nav>

      {/* Parte inferior */}
      <div className="mt-auto flex flex-col gap-0.5">
        <div className="mx-1 mb-3 h-px bg-[#22314F]" />

        {isAuthenticated ? (
          <>
            <Link
              href="/mi-perfil"
              className={
                activeItem === "perfil"
                  ? "flex h-10 items-center gap-3 rounded-lg bg-[#1B2A4D] px-3 text-sm font-semibold text-white"
                  : "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
              }
            >
              <User
                size={18}
                className="text-[#7D89A6]"
              />

              Mi perfil
            </Link>

            <LogoutButton />
          </>
        ) : (
          <>
            <Link
              href="/login?returnTo=/dashboard"
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
            >
              <LogIn size={18} className="text-[#7D89A6]" />

              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
            >
              <UserPlus size={18} className="text-[#7D89A6]" />

              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}