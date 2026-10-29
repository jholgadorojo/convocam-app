import {
  Bookmark,
  CalendarClock,
  CalendarX,
  Target,
} from "lucide-react";
import { PersonalSelectionProcessStatusIndicators } from
  "@/modules/user-selection-process/presentation/personal-selection-process-status-indicators";
import { PersonalStatCard } from "./dashboard-cards";
import { DashboardHeading } from "./dashboard-heading";
import { LatestOfficialPublicationsPanel } from "./latest-publications-panel";
import type { PersonalDashboardData } from "./load-personal-dashboard";
import { NewOpportunitiesPanel } from "./new-opportunities-panel";
import { UpcomingDeadlinesPanel } from "./upcoming-deadlines-panel";

/** Dashboard autenticado: indicadores y paneles de detalle. */
export function PersonalDashboard({
  data,
}: {
  data: PersonalDashboardData;
}) {
  const {
    firstName,
    deadlines,
    userSelectionProcesses,
    expiredDeadlinesCount,
    forMeCount,
    opportunities,
    preferencesNotConfigured,
    latestPublications,
  } = data;

  return (
    <>
      <DashboardHeading
        title={firstName ? `Hola, ${firstName}` : "Tu espacio personal"}
        description="Consulta tus convocatorias seguidas, los plazos próximos y nuevas oportunidades para ti."
      />
      <section
        aria-labelledby="personal-summary-heading"
        className="flex flex-col gap-4"
      >
        <div>
          <h2
            id="personal-summary-heading"
            className="text-lg font-semibold text-[#131A2C]"
          >
            Mi resumen
          </h2>
          <p className="mt-1 text-sm text-[#69738A]">
            Una visión general de tus convocatorias y oportunidades.
          </p>
        </div>
        {/* Primera información: estados personales, a todo el ancho. */}
        <PersonalSelectionProcessStatusIndicators
          layout="horizontal"
          items={userSelectionProcesses}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PersonalStatCard
            icon={<Bookmark size={21} />}
            title="En seguimiento"
            count={deadlines.followedCount}
            description={
              deadlines.followedCount === 0
                ? "Todavía no sigues ninguna convocatoria."
                : "Convocatorias que estás siguiendo, independientemente de su estado."
            }
            href="/mis-convocatorias"
            action="Mis convocatorias"
          />
          <PersonalStatCard
            icon={<CalendarClock size={21} />}
            title="Plazos próximos"
            count={deadlines.upcomingDeadlinesCount}
            description={
              deadlines.upcomingDeadlinesCount === 0
                ? "No tienes plazos de solicitud próximos en los siguientes 15 días."
                : "Convocatorias seguidas cuyo plazo finaliza en los próximos 15 días."
            }
            href="/mis-convocatorias?upcomingDeadlines=1"
            action="Ver mis convocatorias"
          />
          <PersonalStatCard
            icon={<CalendarX size={21} />}
            title="Caducadas"
            count={expiredDeadlinesCount}
            description={
              expiredDeadlinesCount === 0
                ? "No tienes convocatorias pendientes de solicitud con el plazo finalizado."
                : "Convocatorias cuyo plazo terminó y siguen en «Me interesa» o «Preparando solicitud»."
            }
            href="/mis-convocatorias?expiredDeadlines=1"
            action="Ver caducadas"
            tone="danger"
          />
          <PersonalStatCard
            icon={<Target size={21} />}
            title="Para mí"
            count={forMeCount}
            description={
              preferencesNotConfigured
                ? "Configura tus preferencias para descubrir oportunidades personalizadas."
                : forMeCount === 0
                  ? "No hay oportunidades nuevas que coincidan con tus preferencias."
                  : "Oportunidades que encajan con tu perfil y que todavía no sigues."
            }
            href={
              preferencesNotConfigured
                ? "/mi-perfil"
                : "/para-mi"
            }
            action={
              preferencesNotConfigured
                ? "Configurar mi perfil"
                : "Ver todas mis coincidencias"
            }
          />
        </div>
      </section>
      {/* Proporción 55 % / 45 % a partir de pantallas grandes */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:items-start">
        <UpcomingDeadlinesPanel
          items={deadlines.upcomingDeadlines}
        />
        <NewOpportunitiesPanel
          items={opportunities}
          preferencesNotConfigured={preferencesNotConfigured}
        />
      </div>
      {/* Publicaciones oficiales: ancho completo. */}
      <LatestOfficialPublicationsPanel
        items={latestPublications}
      />
    </>
  );
}
