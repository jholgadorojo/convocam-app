import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getSelectionProcessDetailUseCase } from "@/composition/selection-process";
import { getUserSelectionProcessUseCase } from "@/composition/user-selection-process";
import { parsePositiveId } from "@/shared/presentation/parse-positive-id";
import { getCataloniaCalendarDate } from "@/shared/utils/catalonia-calendar-date";
import { ApplicationPeriodCard } from "./application-period-card";
import { DetailHeader } from "./detail-header";
import { getReturnNavigation } from "./detail-presentation";
import { DocumentsSection } from "./documents-section";
import { ImportantDatesSection } from "./important-dates-section";
import { InformationSection } from "./information-section";
import { OfficialSourcesSection } from "./official-sources-section";
import { OfficialStatusCard } from "./official-status-card";
import { PersonalTrackingCard } from "./personal-tracking-card";
import { ReferenceCard } from "./reference-card";
import { RequirementsSection } from "./requirements-section";
import { SubjectAreasSection } from "./subject-areas-section";
import { SummarySection } from "./summary-section";
import { TimelineSection } from "./timeline-section";

type SelectionProcessDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

export default async function SelectionProcessDetailPage({
  params,
  searchParams,
}: SelectionProcessDetailPageProps) {
  const { id: idParam } = await params;
  const parsedId = parsePositiveId(idParam);
  if (parsedId === null) {
    notFound();
  }

  const selectionProcess = await getSelectionProcessDetailUseCase.execute({
    id: parsedId,
  });
  if (!selectionProcess) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = Boolean(session?.user);
  const userSelectionProcess = session?.user
    ? await getUserSelectionProcessUseCase.execute({
      userId: session.user.id,
      selectionProcessId: selectionProcess.id,
    })
    : null;

  const { returnTo } = await searchParams;
  const returnNavigation = getReturnNavigation(returnTo);
  const detailHref =
    `/convocatorias/${selectionProcess.id}` +
    `?returnTo=${encodeURIComponent(returnNavigation.href)}`;
  const today = getCataloniaCalendarDate();

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AppSidebar
        isAuthenticated={isAuthenticated}
        activeItem={returnNavigation.activeSidebarItem}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title="Detalle de convocatoria"
          user={
            session?.user
              ? { name: session.user.name, email: session.user.email }
              : undefined
          }
        />
        <main className="flex-1 px-4 py-8 lg:px-6 lg:pb-12">
          <div className="grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <Link
                href={returnNavigation.href}
                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3B45B5] hover:text-[#2E3794]"
              >
                <ArrowLeft size={16} />
                {returnNavigation.backLabel}
              </Link>
              <DetailHeader selectionProcess={selectionProcess} />
              <SummarySection selectionProcess={selectionProcess} />
              <InformationSection selectionProcess={selectionProcess} />
              <RequirementsSection selectionProcess={selectionProcess} />
              <SubjectAreasSection subjectAreas={selectionProcess.subjectAreas} />
              <TimelineSection selectionProcess={selectionProcess} today={today} />
              <ImportantDatesSection selectionProcess={selectionProcess} today={today} />
              <DocumentsSection documents={selectionProcess.documents} />
              <OfficialSourcesSection selectionProcess={selectionProcess} />
            </div>

            <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6">
              <OfficialStatusCard
                status={selectionProcess.status}
                cidoUrl={selectionProcess.cidoUrl}
              />
              <ApplicationPeriodCard
                selectionProcess={selectionProcess}
                today={today}
              />
              <PersonalTrackingCard
                selectionProcessId={selectionProcess.id}
                userSelectionProcess={userSelectionProcess}
                isAuthenticated={isAuthenticated}
                detailHref={detailHref}
              />
              <ReferenceCard selectionProcess={selectionProcess} />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
