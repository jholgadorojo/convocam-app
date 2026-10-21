import Link from "next/link";
import { List, Map } from "lucide-react";

/**
 * The selected view of the public selection-process search results.
 * The list view remains the default when the URL has no view parameter.
 */
export type SelectionProcessResultsView = "list" | "map";

type Props = {
  activeView: SelectionProcessResultsView;
  listHref: string;
  mapHref: string;
  className?: string;
};

/**
 * Presentation only: the calling page builds both URLs and preserves its filters.
 * Links also work without client-side JavaScript.
 */
export function SelectionProcessResultsViewToggle({
  activeView,
  listHref,
  mapHref,
  className = "",
}: Props) {
  const views = [
    { value: "list", label: "Listado", href: listHref, Icon: List },
    { value: "map", label: "Mapa", href: mapHref, Icon: Map },
  ] as const;

  return (
    <nav
      aria-label="Vista de resultados"
      className={`inline-flex items-center gap-1 rounded-lg border border-[#DDE3EB] bg-white p-1 shadow-sm ${className}`}
    >
      {views.map(({ value, label, href, Icon }) => {
        const isActive = activeView === value;

        return (
          <Link
            key={value}
            href={href}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5BD5] ${
              isActive
                ? "bg-[#4F5BD5] text-white shadow-sm"
                : "text-[#4E5870] hover:bg-[#F4F6FB] hover:text-[#25314A]"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
