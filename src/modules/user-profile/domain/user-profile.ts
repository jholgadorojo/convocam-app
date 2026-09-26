export type UserProfileProps = {
  id?: number;
  userId: string;
  firstName: string;
  lastName: string;
};

export class UserProfile {
  private constructor(private readonly props: UserProfileProps) {}

  static create(props: Omit<UserProfileProps, "id">): UserProfile {
    if (!props.userId.trim()) {
      throw new Error("User id is required");
    }

    if (!props.firstName.trim()) {
      throw new Error("First name is required");
    }

    if (!props.lastName.trim()) {
      throw new Error("Last name is required");
    }

    return new UserProfile({
      userId: props.userId,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
    });
  }

  static restore(props: UserProfileProps): UserProfile {
    if (!props.id || props.id <= 0) {
      throw new Error("Valid id is required");
    }

    return new UserProfile(props);
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
}