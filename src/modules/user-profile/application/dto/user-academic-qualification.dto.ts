
import type { AcademicQualificationType } from "../../domain/user-academic-qualification";

// Datos necesarios para añadir una titulación
export type AddUserAcademicQualificationDto = {
  userId: string;
  qualificationType: AcademicQualificationType;
  name: string;
};

// Datos que devuelve el caso de uso
export type UserAcademicQualificationDto = {
  id: number;
  qualificationType: AcademicQualificationType;
  name: string;
};

// Datos necesarios para consultar las titulaciones
export type ListUserAcademicQualificationsDto = {
  userId: string;
};

export type UpdateUserAcademicQualificationDto = {
  userId: string;
  qualificationId: number;
  qualificationType: AcademicQualificationType;
  name: string;
};

export type DeleteUserAcademicQualificationDto = {
  userId: string;
  qualificationId: number;
};
