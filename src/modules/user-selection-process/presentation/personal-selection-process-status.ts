import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

export const PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS = [
  PersonalSelectionProcessStatus.INTERESTED,
  PersonalSelectionProcessStatus.PREPARING_APPLICATION,
  PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
  PersonalSelectionProcessStatus.ADMITTED,
  PersonalSelectionProcessStatus.EXCLUDED,
  PersonalSelectionProcessStatus.EXAM_PENDING,
  PersonalSelectionProcessStatus.EXAM_COMPLETED,
  PersonalSelectionProcessStatus.COMPLETED,
] as const;

export function getPersonalSelectionProcessStatusLabel(
  status: PersonalSelectionProcessStatus,
): string {
  switch (status) {
    case PersonalSelectionProcessStatus.INTERESTED:
      return "Me interesa";

    case PersonalSelectionProcessStatus.PREPARING_APPLICATION:
      return "Preparando solicitud";

    case PersonalSelectionProcessStatus.APPLICATION_SUBMITTED:
      return "Solicitud presentada";

    case PersonalSelectionProcessStatus.ADMITTED:
      return "Admitido";

    case PersonalSelectionProcessStatus.EXCLUDED:
      return "Excluido";

    case PersonalSelectionProcessStatus.EXAM_PENDING:
      return "Examen pendiente";

    case PersonalSelectionProcessStatus.EXAM_COMPLETED:
      return "Examen realizado";

    case PersonalSelectionProcessStatus.COMPLETED:
      return "Finalizado";
  }
}