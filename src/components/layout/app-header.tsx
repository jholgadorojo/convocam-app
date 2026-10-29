import Link from "next/link";
import { Search } from "lucide-react";

import { MobileNavigation } from "@/components/layout/mobile-navigation";

type AppHeaderProps = {
  title: string;

  user?: {
    name?: string | null;
    email: string;
  };
};

export function AppHeader({
  title,
  user,
}: AppHeaderProps) {
  const initials = getInitials(user?.name, user?.email);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-[#E3E7EE] bg-white px-4 lg:px-10">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNavigation isAuthenticated={Boolean(user)} />

        <span className="truncate text-sm font-semibold text-[#131A2C]">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Búsqueda rápida */}
        <form
          action="/convocatorias"
          className="hidden h-[38px] w-[300px] items-center gap-2.5 rounded-lg border border-[#E3E7EE] bg-[#F4F6F9] px-3 md:flex"
        >
          <Search
            size={16}
            className="shrink-0 text-[#646E85]"
          />

          <input
            type="search"
            name="q"
            maxLength={100}
            placeholder="Búsqueda rápida de convocatorias"
            aria-label="Búsqueda rápida de convocatorias"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#131A2C] outline-none placeholder:text-[#646E85]"
          />
        </form>

        {user ? (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE1FA] text-xs font-bold text-[#3B45B5]">
              {initials}
            </span>

            <span className="hidden text-[13.5px] font-semibold text-[#131A2C] sm:inline">
              {user.name ?? user.email}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login?returnTo=/dashboard"
              className="text-sm font-semibold text-[#3B45B5]"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-[#4F5BD5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B45B5]"
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function getInitials(
  name?: string | null,
  email?: string,
) {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return email?.charAt(0).toUpperCase() ?? "U";
}