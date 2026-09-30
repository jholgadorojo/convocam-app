export type CidoSubjectAreaAttributes = {
  materia: string;
  idModul: number;
};

export type CidoSubjectAreaResource = {
  id: string;
  type: "materies";
  attributes: CidoSubjectAreaAttributes;
};

export type CidoSubjectAreasResponse = {
  data: CidoSubjectAreaResource[];
};