import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getPublicDashboardCountsUseCase } from "@/composition/dashboard";
import { loadPersonalDashboard } from "./load-personal-dashboard";
import { PersonalDashboard } from "./personal-dashboard";
import { VisitorDashboard } from "./visitor-dashboard";
/**
 * SPEC-009 - Ajustes previos a la validacion funcional.
 *
 * - Sin buscador duplicado (ya existe en el menu lateral).
 * - El seguimiento se inicia desde el detalle, no desde el dashboard.
 * - Los enlaces de detalle son botones destacados.
 */
export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={Boolean(user)}
        activeItem="dashboard"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Dashboard"
          user={
            user
              ? {
                name: user.name,
                email: user.email,
              }
              : undefined
          }
        />
        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="flex flex-col gap-7">
            {user ? (
              <PersonalDashboard
                data={await loadPersonalDashboard(user)}
              />
            ) : (
              <VisitorDashboard
                counts={await getPublicDashboardCountsUseCase.execute()}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
