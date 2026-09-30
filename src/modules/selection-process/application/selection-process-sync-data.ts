export type SelectionProcessSyncData = {
  cidoId: string;
  cidoIdentifier: string;
  fileNumber: string | null;
  publicOfferYear: number | null;

  title: string;
  isJobPool: boolean;
  scopeId: number;
  scopeName: string;
  institutionName: string;

  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  applicationEndTime: string | null;
  applicationDeadlineNotes: string | null;

  selectionSystemId: number | null;
  selectionSystem: string | null;

  personnelTypeId: number | null;
  personnelType: string | null;

  qualificationGroupId: number | null;
  qualificationGroup: string | null;

  requiredQualification: string | null;
  otherRequirements: string | null;

  numberOfPositions: number | null;

  reservedDisabilityPositions: number | null;
  reservedUnemployed: boolean;
  reservedYoung: boolean;
  reservedWomen: boolean;

  firstExamDate: Date | null;
  observations: string | null;

  institutionUrl: string | null;
  applicationUrl: string | null;
  cidoUrl: string;

  statusId: number;
  status: string;

  lastDocumentPublicationDate: Date | null;
};