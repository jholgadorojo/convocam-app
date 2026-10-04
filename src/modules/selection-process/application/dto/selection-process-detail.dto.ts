export type SelectionProcessDetailDto = {
  id: number;

  cidoIdentifier: string;
  fileNumber: string | null;
  publicOfferYear: number | null;

  title: string;
  isJobPool: boolean;

  status: string;
  scope: string;

  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  applicationEndTime: string | null;
  applicationDeadlineNotes: string | null;

  selectionSystem: string | null;
  personnelType: string | null;

  qualificationGroup: string | null;
  requiredQualification: string | null;
  otherRequirements: string | null;

  numberOfPositions: number | null;

  firstExamDate: Date | null;
  observations: string | null;

  applicationUrl: string | null;
  institutionUrl: string | null;
  cidoUrl: string;

  lastDocumentPublicationDate: Date | null;

  reservedPlaces: {
    disability: number | null;
    unemployed: boolean;
    youngPeople: boolean;
    women: boolean;
  };

  institution: {
    id: number;
    name: string;
    shortName: string;
    address: string | null;
    postalCode: string | null;
    municipality: string | null;
    county: string | null;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;

  subjectAreas: {
    id: number;
    name: string;
  }[];

  documents: {
    id: number;
    publicationDate: Date;
    summary: string;
    publisher: string | null;
    bulletin: string;
    bulletinNumber: number | null;
    phase: string;
    phaseNotes: string | null;
    documentUrl: string;
    htmlUrl: string | null;
  }[];
};