export type CidoSelectionProcessDocumentAttributes = {
  dataPublicacio: string;
  resum: string;
  anunciant: string | null;

  idButlleti: number;
  butlleti: string;
  numButlleti: number | null;

  dataEntrada: string;

  idFase: number;
  fase: string;
  observacionsFase: string | null;

  urlPdf: string | null;
  urlHtml: string | null;
};

export type CidoSelectionProcessDocumentResource = {
  id: string;
  type: "documents";
  attributes: CidoSelectionProcessDocumentAttributes;
};

export type CidoSelectionProcessDocumentsResponse = {
  data: CidoSelectionProcessDocumentResource[];
};