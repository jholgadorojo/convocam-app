import type { SelectionProcessDetailDto } from
  "@/modules/selection-process/application/dto/selection-process-detail.dto";
import { decodeHtmlEntities } from "@/shared/presentation/decode-html-entities";
import { normalizeSearchText } from "@/shared/presentation/normalize-search-text";

/**
 * Funciones de presentación del detalle de convocatoria.
 *
 * Funciones puras (sin React ni acceso a datos). Las que
 * dependen de la fecha actual reciben `today` (día de
 * calendario de Catalunya a las 00:00 UTC, ver
 * getCataloniaCalendarDate).
 */

type DetailDocument = SelectionProcessDetailDto["documents"][number];

export type TimelineStatus =
  | "completed"
  | "current"
  | "current-known"
  | "future"
  | "unknown";

export type TimelineItem = {
  key: string;
  title: string;
  description?: string;
  date: Date;
  status: TimelineStatus;
};

export type ImportantDate = {
  label: string;
  date: Date;
  state: string;
};

export type OfficialSource = {
  label: string;
  url: string;
  description?: string;
};

/* ============================================================
 *   RETORNO AL LISTADO DE ORIGEN
 *============================================================ */

type ReturnNavigation = {
  href: string;
  activeSidebarItem:
    | "dashboard"
    | "convocatorias"
    | "para-mi"
    | "mis-convocatorias";
  backLabel: string;
};

const DEFAULT_RETURN_NAVIGATION: ReturnNavigation = {
  href: "/convocatorias",
  activeSidebarItem: "convocatorias",
  backLabel: "Volver a los resultados",
};

// Solo se admiten las páginas locales desde las que se llega
// al detalle, exactas o con query string; el resto (incluidas
// las URL externas) vuelve al buscador.
const RETURN_PAGES: Omit<ReturnNavigation, "href">[] = [
  { activeSidebarItem: "convocatorias", backLabel: "Volver a los resultados" },
  { activeSidebarItem: "para-mi", backLabel: "Volver a los resultados" },
  { activeSidebarItem: "mis-convocatorias", backLabel: "Volver a los resultados" },
  { activeSidebarItem: "dashboard", backLabel: "Volver al dashboard" },
];

/**
 * Enlace «Volver», texto del enlace y elemento activo del
 * menú lateral según el parámetro `returnTo`.
 */
export function getReturnNavigation(
  value: string | string[] | undefined,
): ReturnNavigation {
  const returnTo = Array.isArray(value) ? value[0] : value;
  if (!returnTo) {
    return DEFAULT_RETURN_NAVIGATION;
  }
  const page = RETURN_PAGES.find(({ activeSidebarItem }) => {
    const path = `/${activeSidebarItem}`;
    return returnTo === path || returnTo.startsWith(`${path}?`);
  });
  return page ? { ...page, href: returnTo } : DEFAULT_RETURN_NAVIGATION;
}

/* ============================================================
 *   INFORMACIÓN Y REQUISITOS
 *============================================================ */

export function buildInformation(
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    | "isJobPool"
    | "numberOfPositions"
    | "personnelType"
    | "selectionSystem"
    | "scope"
  >,
): string[] {
  const paragraphs: string[] = [];
  const { numberOfPositions } = selectionProcess;
  if (
    !selectionProcess.isJobPool &&
    numberOfPositions !== null &&
    numberOfPositions > 0
  ) {
    paragraphs.push(
      `La convocatoria ofrece ${numberOfPositions} ${numberOfPositions === 1 ? "plaza" : "plazas"}.`,
    );
  }
  if (selectionProcess.personnelType) {
    paragraphs.push(
      `El tipo de personal indicado es ${selectionProcess.personnelType}.`,
    );
  }
  if (selectionProcess.selectionSystem) {
    paragraphs.push(
      `El sistema de selección es ${selectionProcess.selectionSystem}.`,
    );
  }
  if (selectionProcess.scope) {
    paragraphs.push(
      `El ámbito de la convocatoria es ${selectionProcess.scope}.`,
    );
  }
  if (paragraphs.length === 0) {
    paragraphs.push(
      "Consulta las fuentes oficiales para ampliar la información de esta convocatoria.",
    );
  }
  return paragraphs;
}

export function buildRequirements(
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    "requiredQualification" | "otherRequirements" | "qualificationGroup"
  >,
): string[] {
  const requirements: string[] = [];
  if (selectionProcess.requiredQualification) {
    requirements.push(selectionProcess.requiredQualification);
  }
  if (selectionProcess.otherRequirements) {
    requirements.push(selectionProcess.otherRequirements);
  }
  if (requirements.length === 0 && selectionProcess.qualificationGroup) {
    requirements.push(
      `Grupo de titulación: ${selectionProcess.qualificationGroup}.`,
    );
  }
  return requirements;
}

/** Primer documento que menciona las bases (sin tildes ni mayúsculas). */
export function findBasesDocument<
  T extends Pick<DetailDocument, "phase" | "summary" | "phaseNotes">,
>(documents: T[]): T | null {
  return (
    documents.find((document) =>
      normalizeSearchText(
        [document.phase, document.summary, document.phaseNotes ?? ""].join(" "),
      ).includes("base"),
    ) ?? null
  );
}

/* ============================================================
 *   CRONOLOGÍA
 *============================================================ */

/**
 * Hitos ordenados por fecha: publicaciones, plazo de
 * solicitud y primera prueba. Si ningún hito es de hoy,
 * el último ya pasado se marca como «Último hito».
 */
export function buildTimeline(
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    "applicationStartDate" | "applicationEndDate" | "firstExamDate"
  > & {
    documents: Pick<DetailDocument, "id" | "publicationDate" | "phase" | "summary">[];
  },
  today: Date,
): TimelineItem[] {
  const rawItems: Omit<TimelineItem, "status">[] = [];
  for (const document of selectionProcess.documents) {
    rawItems.push({
      key: `document-${document.id}`,
      title: document.phase || "Publicación oficial",
      description: decodeHtmlEntities(document.summary),
      date: document.publicationDate,
    });
  }
  if (selectionProcess.applicationStartDate) {
    rawItems.push({
      key: "application-start",
      title: "Inicio del plazo de solicitud",
      date: selectionProcess.applicationStartDate,
    });
  }
  if (selectionProcess.applicationEndDate) {
    rawItems.push({
      key: "application-end",
      title: "Fin del plazo de solicitud",
      date: selectionProcess.applicationEndDate,
    });
  }
  if (selectionProcess.firstExamDate) {
    rawItems.push({
      key: "first-exam",
      title: "Primera prueba",
      date: selectionProcess.firstExamDate,
    });
  }

  rawItems.sort((first, second) => first.date.getTime() - second.date.getTime());

  let hasCurrent = false;
  const items: TimelineItem[] = rawItems.map((item) => {
    const comparison = compareDateOnly(item.date, today);
    let status: TimelineStatus;
    if (comparison < 0) {
      status = "completed";
    } else if (comparison === 0) {
      status = "current";
      hasCurrent = true;
    } else {
      status = "future";
    }
    return { ...item, status };
  });

  if (!hasCurrent) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].status === "completed") {
        items[index] = { ...items[index], status: "current-known" };
        break;
      }
    }
  }
  return items;
}

export function getTimelinePresentation(status: TimelineStatus): {
  label: string;
  dotClassName: string;
  badgeClassName: string;
} {
  switch (status) {
    case "completed":
      return {
        label: "Finalizada",
        dotClassName: "border-[#8A93A7] bg-[#8A93A7]",
        badgeClassName: "bg-[#F1F3F7] text-[#69738A]",
      };
    case "current":
      return {
        label: "Hoy",
        dotClassName: "border-[#4F5BD5] bg-[#4F5BD5]",
        badgeClassName: "bg-[#EEF0FC] text-[#3B45B5]",
      };
    case "current-known":
      return {
        label: "Último hito",
        dotClassName: "border-[#4F5BD5] bg-[#4F5BD5]",
        badgeClassName: "bg-[#EEF0FC] text-[#3B45B5]",
      };
    case "future":
      return {
        label: "Próxima",
        dotClassName: "border-[#D5DAE3] bg-white",
        badgeClassName: "bg-[#F7F8FA] text-[#69738A]",
      };
    default:
      return {
        label: "Sin determinar",
        dotClassName: "border-[#D5DAE3] bg-white",
        badgeClassName: "bg-[#F7F8FA] text-[#69738A]",
      };
  }
}

/* ============================================================
 *   FECHAS IMPORTANTES
 *============================================================ */

export function buildImportantDates(
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    | "applicationStartDate"
    | "applicationEndDate"
    | "firstExamDate"
    | "lastDocumentPublicationDate"
  >,
  today: Date,
): ImportantDate[] {
  const candidates: [string, Date | null][] = [
    ["Inicio de solicitudes", selectionProcess.applicationStartDate],
    ["Fin de solicitudes", selectionProcess.applicationEndDate],
    ["Primera prueba", selectionProcess.firstExamDate],
    ["Última publicación oficial", selectionProcess.lastDocumentPublicationDate],
  ];
  return candidates
    .filter((candidate): candidate is [string, Date] => candidate[1] !== null)
    .map(([label, date]) => ({
      label,
      date,
      state: getDateState(date, today),
    }));
}

function getDateState(date: Date, today: Date): string {
  const comparison = compareDateOnly(date, today);
  if (comparison < 0) {
    return "Finalizada";
  }
  if (comparison === 0) {
    return "Hoy";
  }
  return "Próxima";
}

/* ============================================================
 *   FUENTES OFICIALES
 *============================================================ */

/**
 * Enlaces oficiales sin repetir URL: web del organismo,
 * presentación de solicitudes, ficha CIDO y la versión
 * HTML de cada publicación en boletín.
 */
export function buildOfficialSources(
  selectionProcess: Pick<
    SelectionProcessDetailDto,
    "institutionUrl" | "applicationUrl" | "cidoUrl"
  > & {
    institution: Pick<
      NonNullable<SelectionProcessDetailDto["institution"]>,
      "name"
    > | null;
    documents: Pick<DetailDocument, "htmlUrl" | "bulletin" | "bulletinNumber">[];
  },
): OfficialSource[] {
  const sources = new Map<string, OfficialSource>();
  if (selectionProcess.institutionUrl) {
    sources.set(selectionProcess.institutionUrl, {
      label: selectionProcess.institution?.name ?? "Organismo convocante",
      url: selectionProcess.institutionUrl,
      description: "Web oficial del organismo",
    });
  }
  if (selectionProcess.applicationUrl) {
    sources.set(selectionProcess.applicationUrl, {
      label: "Presentación de solicitudes",
      url: selectionProcess.applicationUrl,
      description: "Canal oficial para la solicitud",
    });
  }
  sources.set(selectionProcess.cidoUrl, {
    label: "CIDO — Diputació de Barcelona",
    url: selectionProcess.cidoUrl,
    description: "Ficha oficial de la convocatoria",
  });
  for (const document of selectionProcess.documents) {
    if (!document.htmlUrl) {
      continue;
    }
    sources.set(document.htmlUrl, {
      label:
        document.bulletinNumber !== null
          ? `${document.bulletin} · nº ${document.bulletinNumber}`
          : document.bulletin,
      url: document.htmlUrl,
      description: "Publicación oficial",
    });
  }
  return [...sources.values()];
}

/* ============================================================
 *   PLAZO
 *============================================================ */

/** Porcentaje transcurrido del plazo de solicitud (0-100). */
export function calculateApplicationProgress(
  startDate: Date | null,
  endDate: Date | null,
  today: Date,
): number | null {
  if (!startDate || !endDate) {
    return null;
  }
  const start = toDateOnlyUtc(startDate).getTime();
  const end = toDateOnlyUtc(endDate).getTime();
  if (end <= start) {
    return null;
  }
  const current = today.getTime();
  if (current <= start) {
    return 0;
  }
  if (current >= end) {
    return 100;
  }
  return Math.round(((current - start) / (end - start)) * 100);
}

/* ============================================================
 *   FECHAS Y TEXTO
 *============================================================ */

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Europe/Madrid",
});

/** Fecha y hora de Catalunya (dd/mm/aaaa, hh:mm:ss). */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

function compareDateOnly(first: Date, second: Date): number {
  return toDateOnlyUtc(first).getTime() - toDateOnlyUtc(second).getTime();
}

function toDateOnlyUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
