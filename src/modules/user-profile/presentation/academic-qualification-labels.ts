
import type { AcademicQualificationType } from "../domain/user-academic-qualification";

export const ACADEMIC_QUALIFICATION_LABELS: Record<
  AcademicQualificationType,
  string
> = {
  PRIMARY: "Educación primaria",
  SCHOOL_GRADUATE: "Graduado escolar",
  ESO: "Educación Secundaria Obligatoria (ESO)",
  BACCALAUREATE: "Bachillerato",
  VOCATIONAL_BASIC: "Formación Profesional de Grado Básico",
  VOCATIONAL_INTERMEDIATE: "Formación Profesional de Grado Medio",
  VOCATIONAL_HIGHER: "Formación Profesional de Grado Superior",
  UNIVERSITY_DIPLOMA: "Diplomatura universitaria",
  UNIVERSITY_DEGREE: "Grado universitario",
  UNIVERSITY_LICENTIATE: "Licenciatura universitaria",
  UNIVERSITY_MASTER: "Máster universitario",
  DOCTORATE: "Doctorado",
  OTHER: "Otra titulación",
};
