import {
  AppNavigation,
  type AppNavigationItem,
} from "@/components/layout/app-navigation";

type AppSidebarProps = {
  isAuthenticated: boolean;
  activeItem?: AppNavigationItem;
};

/**
 * Menú lateral de escritorio (desde `lg`). En pantallas más
 * estrechas el mismo menú se abre desde la cabecera
 * (MobileNavigation).
 */
export function AppSidebar({
  isAuthenticated,
  activeItem = "dashboard",
}: AppSidebarProps) {
  return (
    <aside className="hidden sticky top-0 h-screen min-h-screen w-[264px] shrink-0 flex-col bg-[#0E1A33] px-[14px] pb-5 pt-[18px] lg:flex">
      <AppNavigation
        isAuthenticated={isAuthenticated}
        activeItem={activeItem}
      />
    </aside>
  );
}
