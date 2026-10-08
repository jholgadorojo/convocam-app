import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

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