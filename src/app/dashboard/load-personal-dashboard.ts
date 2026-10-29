import {
  getDashboardLatestPublicationsUseCase,
  getPersonalDashboardDeadlinesUseCase,
} from "@/composition/dashboard";
import {
  listSelectionProcessesForMeUseCase,
} from "@/composition/selection-process";
import { listUserSelectionProcessesUseCase } from
  "@/composition/user-selection-process";
import type { DashboardLatestPublicationItem } from
  "@/modules/dashboard/application/dashboard-query-repository";
import type { PersonalDashboardDeadlines } from
  "@/modules/dashboard/application/get-personal-dashboard-deadlines";
import type { SelectionProcessListItem } from
  "@/modules/selection-process/application/selection-process-list-item";
import type { UserSelectionProcessListItem } from
  "@/modules/user-selection-process/application/user-selection-process-list-item";
import { getCataloniaCalendarDate } from "@/shared/utils/catalonia-calendar-date";

/**
 * SPEC-009 - Datos del dashboard de un usuario con sesión.
 */
export type PersonalDashboardData = {
  firstName: string | null;
  deadlines: PersonalDashboardDeadlines;
  // Estados personales: mismo origen de datos que «Mis convocatorias».
  userSelectionProcesses: UserSelectionProcessListItem[];
  expiredDeadlinesCount: number;
  forMeCount: number | null;
  opportunities: SelectionProcessListItem[];
  preferencesNotConfigured: boolean;
  latestPublications: DashboardLatestPublicationItem[];
};

export async function loadPersonalDashboard(user: {
  id: string;
  name: string | null | undefined;
}): Promise<PersonalDashboardData> {
  const [
    deadlines,
    forMeResult,
    latestPublications,
    userSelectionProcesses,
  ] = await Promise.all([
    getPersonalDashboardDeadlinesUseCase.execute({
      userId: user.id,
    }),
    listSelectionProcessesForMeUseCase.execute({
      userId: user.id,
      page: 1,
      pageSize: 3,
      excludeFollowed: true,
    }),
    getDashboardLatestPublicationsUseCase
      .execute({ userId: user.id })
      .then((result) => result.publications),
    listUserSelectionProcessesUseCase.execute(user.id),
  ]);

  return {
    firstName: user.name?.trim().split(/\s+/)[0] || null,
    deadlines,
    userSelectionProcesses,
    expiredDeadlinesCount: countExpiredDeadlines(userSelectionProcesses),
    forMeCount:
      forMeResult.kind === "results"
        ? forMeResult.page.totalItems
        : null,
    opportunities:
      forMeResult.kind === "results"
        ? forMeResult.page.items
        : [],
    preferencesNotConfigured:
      forMeResult.kind === "preferences-not-configured",
    latestPublications,
  };
}

// Igual que en Mis convocatorias: estados INTERESTED/PREPARING_APPLICATION
// con fecha final anterior al dia actual en Catalunya.
function countExpiredDeadlines(
  userSelectionProcesses: UserSelectionProcessListItem[],
): number {
  const cataloniaToday = getCataloniaCalendarDate(new Date());

  return userSelectionProcesses.filter((item) => {
    const endDate = item.selectionProcess.applicationEndDate;
    return (
      (item.personalStatus === "INTERESTED" ||
        item.personalStatus === "PREPARING_APPLICATION") &&
      endDate !== null &&
      endDate.getTime() < cataloniaToday.getTime()
    );
  }).length;
}
