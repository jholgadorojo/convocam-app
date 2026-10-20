import {
  BadgeCheck,
  CheckCircle2,
  CircleX,
  Clock3,
  FileCheck2,
  Flag,
  Heart,
  Send,
} from "lucide-react";

import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

/**
 * Configuracion visual compartida de los estados personales.
 * Se utiliza tanto en el selector de estado como en los filtros de Mis convocatorias.
 * El orden coincide con el del selector actual.
 */
export const PERSONAL_SELECTION_PROCESS_STATUS_OPTIONS = [
  {
    value: PersonalSelectionProcessStatus.INTERESTED,
    label: "Me interesa",
    description: "Quiero seguir esta convocatoria.",
    icon: Heart,
  },
  {
    value: PersonalSelectionProcessStatus.PREPARING_APPLICATION,
    label: "Preparando solicitud",
    description: "Estoy preparando la documentación.",
    icon: FileCheck2,
  },
  {
    value: PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
    label: "Solicitud presentada",
    description: "Ya he presentado la solicitud.",
    icon: Send,
  },
  {
    value: PersonalSelectionProcessStatus.ADMITTED,
    label: "Admitido",
    description: "He sido admitido en el proceso.",
    icon: BadgeCheck,
  },
  {
    value: PersonalSelectionProcessStatus.EXCLUDED,
    label: "Excluido",
    description: "He quedado excluido del proceso.",
    icon: CircleX,
  },
  {
    value: PersonalSelectionProcessStatus.EXAM_PENDING,
    label: "Examen pendiente",
    description: "Estoy pendiente de realizar el examen.",
    icon: Clock3,
  },
  {
    value: PersonalSelectionProcessStatus.EXAM_COMPLETED,
    label: "Examen realizado",
    description: "Ya he realizado el examen.",
    icon: CheckCircle2,
  },
  {
    value: PersonalSelectionProcessStatus.COMPLETED,
    label: "Finalizado",
    description: "He terminado el seguimiento del proceso.",
    icon: Flag,
  },
] as const;
