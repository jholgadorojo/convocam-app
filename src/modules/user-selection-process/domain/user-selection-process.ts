import { PersonalSelectionProcessStatus } from "./personal-selection-process-status";

type UserSelectionProcessProps = {
  id?: number;
  userId: string;
  selectionProcessId: number;
  personalStatus: PersonalSelectionProcessStatus;
  followedAt: Date;
  personalStatusUpdatedAt: Date;
  updatedAt: Date;
};

type CreateUserSelectionProcessProps = {
  userId: string;
  selectionProcessId: number;
};

export class UserSelectionProcess {
  private readonly props: UserSelectionProcessProps;

  private constructor(
    props: UserSelectionProcessProps,
  ) {
    this.props = props;
  }

  static create(
    props: CreateUserSelectionProcessProps,
    now: Date = new Date(),
  ): UserSelectionProcess {
    const userId =
      UserSelectionProcess.validateUserId(
        props.userId,
      );

    UserSelectionProcess.validateSelectionProcessId(
      props.selectionProcessId,
    );

    return new UserSelectionProcess({
      userId,
      selectionProcessId:
        props.selectionProcessId,
      personalStatus:
        PersonalSelectionProcessStatus.INTERESTED,
      followedAt: now,
      personalStatusUpdatedAt: now,
      updatedAt: now,
    });
  }

  static restore(
    props: UserSelectionProcessProps,
  ): UserSelectionProcess {
    if (
      props.id === undefined ||
      !Number.isInteger(props.id) ||
      props.id <= 0
    ) {
      throw new Error(
        "El identificador del seguimiento debe ser válido.",
      );
    }

    const userId =
      UserSelectionProcess.validateUserId(
        props.userId,
      );

    UserSelectionProcess.validateSelectionProcessId(
      props.selectionProcessId,
    );

    UserSelectionProcess.validateDate(
      props.followedAt,
      "La fecha de seguimiento debe ser válida.",
    );

    UserSelectionProcess.validateDate(
      props.personalStatusUpdatedAt,
      "La fecha de actualización del estado personal debe ser válida.",
    );

    UserSelectionProcess.validateDate(
      props.updatedAt,
      "La fecha de actualización debe ser válida.",
    );

    return new UserSelectionProcess({
      ...props,
      userId,
    });
  }

  changePersonalStatus(
    personalStatus: PersonalSelectionProcessStatus,
    now: Date = new Date(),
  ): void {
    if (
      this.props.personalStatus ===
      personalStatus
    ) {
      return;
    }

    UserSelectionProcess.validateDate(
      now,
      "La fecha de actualización debe ser válida.",
    );

    this.props.personalStatus =
      personalStatus;

    this.props.personalStatusUpdatedAt =
      now;

    this.props.updatedAt = now;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get selectionProcessId(): number {
    return this.props.selectionProcessId;
  }

  get personalStatus(): PersonalSelectionProcessStatus {
    return this.props.personalStatus;
  }

  get followedAt(): Date {
    return this.props.followedAt;
  }

  get personalStatusUpdatedAt(): Date {
    return this.props.personalStatusUpdatedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private static validateUserId(
    userId: string,
  ): string {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      throw new Error(
        "El identificador del usuario es obligatorio.",
      );
    }

    return normalizedUserId;
  }

  private static validateSelectionProcessId(
    selectionProcessId: number,
  ): void {
    if (
      !Number.isInteger(selectionProcessId) ||
      selectionProcessId <= 0
    ) {
      throw new Error(
        "El identificador de la convocatoria debe ser válido.",
      );
    }
  }

  private static validateDate(
    date: Date,
    errorMessage: string,
  ): void {
    if (
      !(date instanceof Date) ||
      Number.isNaN(date.getTime())
    ) {
      throw new Error(errorMessage);
    }
  }
}