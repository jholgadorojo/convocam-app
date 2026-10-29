import { describe, expect, it } from "vitest";

import {
  buildImportantDates,
  buildInformation,
  buildOfficialSources,
  buildRequirements,
  buildTimeline,
  calculateApplicationProgress,
  findBasesDocument,
  formatLocation,
  formatNumberOfPositions,
  getReturnNavigation,
} from "./detail-presentation";

const today = new Date("2026-11-10T00:00:00.000Z");

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

describe("getReturnNavigation", () => {
  it.each([
    ["/convocatorias?q=auxiliar", "convocatorias", "Volver a los resultados"],
    ["/para-mi?page=2", "para-mi", "Volver a los resultados"],
    ["/mis-convocatorias", "mis-convocatorias", "Volver a los resultados"],
    ["/dashboard", "dashboard", "Volver al dashboard"],
  ])("vuelve a %s", (returnTo, activeSidebarItem, backLabel) => {
    expect(getReturnNavigation(returnTo)).toEqual({
      href: returnTo,
      activeSidebarItem,
      backLabel,
    });
  });

  it("usa el primer valor si el parámetro se repite", () => {
    expect(getReturnNavigation(["/dashboard", "/para-mi"]).href).toBe(
      "/dashboard",
    );
  });

  it.each([
    ["falta", undefined],
    ["es una URL externa", "https://evil.com"],
    ["es protocol-relative", "//evil.com/dashboard"],
    ["solo comparte prefijo", "/dashboard-falso"],
    ["es otra página", "/mi-perfil"],
  ])("vuelve al buscador si returnTo %s", (_, value) => {
    expect(getReturnNavigation(value)).toEqual({
      href: "/convocatorias",
      activeSidebarItem: "convocatorias",
      backLabel: "Volver a los resultados",
    });
  });
});

describe("formatNumberOfPositions", () => {
  it("muestra las plazas de una plaza de plantilla", () => {
    expect(formatNumberOfPositions(3, false)).toBe("3");
  });

  it("no muestra plazas en una bolsa de trabajo", () => {
    expect(formatNumberOfPositions(3, true)).toBe("—");
  });

  it.each([null, 0])("indica «Sin definir» si las plazas son %s", (value) => {
    expect(formatNumberOfPositions(value, false)).toBe("Sin definir");
  });
});

describe("formatLocation", () => {
  it("une municipio, comarca y provincia omitiendo los vacíos", () => {
    expect(
      formatLocation({
        municipality: "Terrassa",
        county: null,
        province: "Barcelona",
      }),
    ).toBe("Terrassa · Barcelona");
  });

  it("indica que no hay ubicación sin institución o sin datos", () => {
    expect(formatLocation(null)).toBe("Ubicación no disponible");
    expect(
      formatLocation({ municipality: null, county: null, province: null }),
    ).toBe("Ubicación no disponible");
  });
});

describe("buildInformation", () => {
  const base = {
    isJobPool: false,
    numberOfPositions: null,
    personnelType: null,
    selectionSystem: null,
    scope: "",
  };

  it("redacta un párrafo por dato disponible", () => {
    expect(
      buildInformation({
        ...base,
        numberOfPositions: 1,
        selectionSystem: "concurso-oposición",
      }),
    ).toEqual([
      "La convocatoria ofrece 1 plaza.",
      "El sistema de selección es concurso-oposición.",
    ]);
  });

  it("no indica plazas en una bolsa de trabajo", () => {
    expect(
      buildInformation({ ...base, isJobPool: true, numberOfPositions: 4 }),
    ).toEqual([
      "Consulta las fuentes oficiales para ampliar la información de esta convocatoria.",
    ]);
  });
});

describe("buildRequirements", () => {
  it("lista titulación y otros requisitos", () => {
    expect(
      buildRequirements({
        requiredQualification: "Grado en Derecho",
        otherRequirements: "Nivel C1 de catalán",
        qualificationGroup: "A1",
      }),
    ).toEqual(["Grado en Derecho", "Nivel C1 de catalán"]);
  });

  it("recurre al grupo de titulación si no hay otros requisitos", () => {
    expect(
      buildRequirements({
        requiredQualification: null,
        otherRequirements: null,
        qualificationGroup: "C1",
      }),
    ).toEqual(["Grupo de titulación: C1."]);
  });
});

describe("findBasesDocument", () => {
  it("encuentra el documento de bases sin distinguir tildes ni mayúsculas", () => {
    const documents = [
      { phase: "Admesos", summary: "Llista provisional", phaseNotes: null },
      { phase: "Convocatòria", summary: "Aprovació de les BASES", phaseNotes: null },
    ];
    expect(findBasesDocument(documents)).toBe(documents[1]);
  });

  it("devuelve null si ninguno menciona las bases", () => {
    expect(
      findBasesDocument([
        { phase: "Admesos", summary: "Llista", phaseNotes: null },
      ]),
    ).toBeNull();
  });
});

describe("buildTimeline", () => {
  const noDates = {
    applicationStartDate: null,
    applicationEndDate: null,
    firstExamDate: null,
    documents: [],
  };

  it("ordena los hitos por fecha y marca el de hoy", () => {
    const timeline = buildTimeline(
      {
        applicationStartDate: date("2026-11-10"),
        applicationEndDate: date("2026-11-30"),
        firstExamDate: null,
        documents: [
          {
            id: 7,
            publicationDate: date("2026-11-02"),
            phase: "",
            summary: "Bases &amp; convocatoria",
          },
        ],
      },
      today,
    );

    expect(timeline.map(({ key, status }) => [key, status])).toEqual([
      ["document-7", "completed"],
      ["application-start", "current"],
      ["application-end", "future"],
    ]);
    expect(timeline[0]).toMatchObject({
      title: "Publicación oficial",
      description: "Bases & convocatoria",
    });
  });

  it("marca el último hito pasado si ninguno es de hoy", () => {
    const timeline = buildTimeline(
      {
        ...noDates,
        applicationStartDate: date("2026-10-01"),
        applicationEndDate: date("2026-10-20"),
        firstExamDate: date("2026-12-15"),
      },
      today,
    );

    expect(timeline.map(({ status }) => status)).toEqual([
      "completed",
      "current-known",
      "future",
    ]);
  });

  it("no hay hitos sin fechas ni documentos", () => {
    expect(buildTimeline(noDates, today)).toEqual([]);
  });
});

describe("buildImportantDates", () => {
  it("incluye solo las fechas disponibles con su estado", () => {
    expect(
      buildImportantDates(
        {
          applicationStartDate: date("2026-11-01"),
          applicationEndDate: date("2026-11-10"),
          firstExamDate: null,
          lastDocumentPublicationDate: date("2026-12-01"),
        },
        today,
      ),
    ).toEqual([
      { label: "Inicio de solicitudes", date: date("2026-11-01"), state: "Finalizada" },
      { label: "Fin de solicitudes", date: date("2026-11-10"), state: "Hoy" },
      { label: "Última publicación oficial", date: date("2026-12-01"), state: "Próxima" },
    ]);
  });
});

describe("buildOfficialSources", () => {
  it("lista las fuentes sin repetir URL", () => {
    const sources = buildOfficialSources({
      institutionUrl: "https://ajuntament.cat",
      applicationUrl: "https://ajuntament.cat",
      cidoUrl: "https://cido.diba.cat/1",
      institution: { name: "Ajuntament de Terrassa" },
      documents: [
        { htmlUrl: "https://bop.cat/1", bulletin: "BOPB", bulletinNumber: 12 },
        { htmlUrl: "https://bop.cat/1", bulletin: "BOPB", bulletinNumber: 12 },
        { htmlUrl: null, bulletin: "DOGC", bulletinNumber: null },
      ],
    });

    expect(sources.map(({ label, url }) => [label, url])).toEqual([
      ["Presentación de solicitudes", "https://ajuntament.cat"],
      ["CIDO — Diputació de Barcelona", "https://cido.diba.cat/1"],
      ["BOPB · nº 12", "https://bop.cat/1"],
    ]);
  });
});

describe("calculateApplicationProgress", () => {
  it("calcula el porcentaje transcurrido del plazo", () => {
    expect(
      calculateApplicationProgress(date("2026-11-05"), date("2026-11-15"), today),
    ).toBe(50);
  });

  it("es 0 antes del inicio y 100 a partir del fin", () => {
    expect(
      calculateApplicationProgress(date("2026-11-12"), date("2026-11-20"), today),
    ).toBe(0);
    expect(
      calculateApplicationProgress(date("2026-11-01"), date("2026-11-10"), today),
    ).toBe(100);
  });

  it("es null si falta alguna fecha o el plazo no es válido", () => {
    expect(calculateApplicationProgress(null, date("2026-11-20"), today)).toBeNull();
    expect(
      calculateApplicationProgress(date("2026-11-20"), date("2026-11-20"), today),
    ).toBeNull();
  });
});
