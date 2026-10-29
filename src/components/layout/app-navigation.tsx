import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bookmark,
  LayoutDashboard,
  LogIn,
  Search,
  Target,
  User,
  UserPlus,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";

export type AppNavigationItem =
  | "dashboard"
  | "convocatorias"
  | "para-mi"
  | "mis-convocatorias"
  | "perfil";

/**
 * Contenido del menú de la aplicación: logo, secciones y cuenta.
 *
 * Lo comparten el menú lateral de escritorio (AppSidebar) y el
 * panel de pantallas estrechas (MobileNavigation). El contenedor
 * debe ser `flex flex-col` para que la cuenta quede abajo.
 */
export function AppNavigation({
  isAuthenticated,
  activeItem,
}: {
  isAuthenticated: boolean;
  activeItem?: AppNavigationItem;
}) {
  return (
    <>
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
        <NavLink
          href="/dashboard"
          active={activeItem === "dashboard"}
          icon={<LayoutDashboard size={18} className="text-[#A9B1FF]" />}
        >
          Dashboard
        </NavLink>

        <NavLink
          href="/convocatorias"
          active={activeItem === "convocatorias"}
          icon={<Search size={18} className="text-[#7D89A6]" />}
        >
          Buscar convocatorias
        </NavLink>

        {/* SPEC-008 — Para mí */}
        <NavLink
          href={isAuthenticated ? "/para-mi" : "/login?returnTo=/para-mi"}
          active={activeItem === "para-mi"}
          icon={<Target size={18} className="text-[#7D89A6]" />}
        >
          Para mí
        </NavLink>

        <NavLink
          href={
            isAuthenticated
              ? "/mis-convocatorias"
              : "/login?returnTo=/mis-convocatorias"
          }
          active={activeItem === "mis-convocatorias"}
          icon={<Bookmark size={18} className="text-[#7D89A6]" />}
        >
          Mis convocatorias
        </NavLink>
      </nav>

      {/* Parte inferior */}
      <div className="mt-auto flex flex-col gap-0.5">
        <div className="mx-1 mb-3 h-px bg-[#22314F]" />

        {isAuthenticated ? (
          <>
            <NavLink
              href="/mi-perfil"
              active={activeItem === "perfil"}
              icon={<User size={18} className="text-[#7D89A6]" />}
            >
              Mi perfil
            </NavLink>

            <LogoutButton />
          </>
        ) : (
          <>
            <NavLink
              href="/login?returnTo=/dashboard"
              icon={<LogIn size={18} className="text-[#7D89A6]" />}
            >
              Iniciar sesión
            </NavLink>

            <NavLink
              href="/register"
              icon={<UserPlus size={18} className="text-[#7D89A6]" />}
            >
              Crear cuenta
            </NavLink>
          </>
        )}
      </div>
    </>
  );
}

function NavLink({
  href,
  active = false,
  icon,
  children,
}: {
  href: string;
  active?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex h-10 items-center gap-3 rounded-lg bg-[#1B2A4D] px-3 text-sm font-semibold text-white"
          : "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#AEB8CE] hover:bg-[#1B2A4D]"
      }
    >
      {icon}
      {children}
    </Link>
  );
}
