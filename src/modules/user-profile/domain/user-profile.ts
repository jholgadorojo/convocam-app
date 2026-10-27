export const MAX_FIRST_NAME_LENGTH = 100;
export const MAX_LAST_NAME_LENGTH = 150;

export const FIRST_NAME_TOO_LONG_MESSAGE =
  `El nombre no puede superar los ${MAX_FIRST_NAME_LENGTH} caracteres`;
export const LAST_NAME_TOO_LONG_MESSAGE =
  `Los apellidos no pueden superar los ${MAX_LAST_NAME_LENGTH} caracteres`;

export type UserProfileProps = {
  id?: number;
  userId: string;
  firstName: string;
  lastName: string;
  residenceMunicipalityId?: number | null;
};

export class UserProfile {
  private constructor(private readonly props: UserProfileProps) { }

  static create(
    props: Omit<UserProfileProps, "id" | "residenceMunicipalityId">,
  ): UserProfile {
    if (!props.userId.trim()) {
      throw new Error("El identificador del usuario es obligatorio");
    }

    if (!props.firstName.trim()) {
      throw new Error("El nombre es obligatorio");
    }

    if (!props.lastName.trim()) {
      throw new Error("Los apellidos son obligatorios");
    }

    UserProfile.validateNameLengths(
      props.firstName.trim(),
      props.lastName.trim(),
    );

    return new UserProfile({
      userId: props.userId,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      residenceMunicipalityId: null,
    });
  }

  static restore(props: UserProfileProps): UserProfile {
    if (!props.id || props.id <= 0) {
      throw new Error("El identificador del perfil no es válido");
    }

    return new UserProfile({
      ...props,
      residenceMunicipalityId: props.residenceMunicipalityId ?? null,
    });
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get residenceMunicipalityId(): number | null {
    return this.props.residenceMunicipalityId ?? null;
  }

  changePersonalData(firstName: string, lastName: string): void {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (!normalizedFirstName) {
      throw new Error("El nombre es obligatorio");
    }

    if (!normalizedLastName) {
      throw new Error("Los apellidos son obligatorios");
    }

    UserProfile.validateNameLengths(
      normalizedFirstName,
      normalizedLastName,
    );

    this.props.firstName = normalizedFirstName;
    this.props.lastName = normalizedLastName;
  }

  changeResidenceMunicipality(municipalityId: number | null): void {
    if (
      municipalityId !== null &&
      (!Number.isInteger(municipalityId) || municipalityId <= 0)
    ) {
      throw new Error("El municipio de residencia no es válido");
    }

    this.props.residenceMunicipalityId = municipalityId;
  }

  static createForRegistration(input: {
    userId: string;
    name: string;
  }): UserProfile {
    const userId = input.userId.trim();
    const firstName = input.name.trim();

    if (!userId) {
      throw new Error("El usuario es obligatorio");
    }

    if (!firstName) {
      throw new Error("El nombre es obligatorio");
    }

    UserProfile.validateNameLengths(firstName, "");

    return new UserProfile({
      userId,
      firstName,
      lastName: "",
      residenceMunicipalityId: null,
    });
  }

  // Solo se aplica al crear o modificar, no en restore,
  // para no impedir cargar datos guardados anteriormente.
  private static validateNameLengths(
    firstName: string,
    lastName: string,
  ): void {
    if (firstName.length > MAX_FIRST_NAME_LENGTH) {
      throw new Error(FIRST_NAME_TOO_LONG_MESSAGE);
    }

    if (lastName.length > MAX_LAST_NAME_LENGTH) {
      throw new Error(LAST_NAME_TOO_LONG_MESSAGE);
    }
  }

}