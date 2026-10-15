
export type ProfessionalPreferenceSubjectAreaOptionDto = {
  id: number;
  name: string;
};

export type ProfessionalPreferenceOptionsDto = {
  subjectAreas: ProfessionalPreferenceSubjectAreaOptionDto[];

  qualificationGroups: string[];
};
