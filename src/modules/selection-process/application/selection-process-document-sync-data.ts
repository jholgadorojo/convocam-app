export type SelectionProcessDocumentSyncData = {
  cidoId: string;

  publicationDate: Date;
  summary: string;
  publisher: string | null;

  bulletinId: number;
  bulletin: string;
  bulletinNumber: number | null;

  entryDate: Date;

  phaseId: number;
  phase: string;
  phaseNotes: string | null;

  documentUrl: string;
  htmlUrl: string | null;
};