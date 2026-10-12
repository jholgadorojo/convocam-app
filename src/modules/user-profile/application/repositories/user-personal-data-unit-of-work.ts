
import { UserProfile } from "../../domain/user-profile";

export interface UserPersonalDataUnitOfWork {
  saveProfileAndUserName(
    profile: UserProfile,
  ): Promise<UserProfile>;
}
