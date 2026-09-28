import { UserProfile } from "../../domain/user-profile";

export interface UserProfileRepository {
  save(profile: UserProfile): Promise<UserProfile>;

  findByUserId(userId: string): Promise<UserProfile | null>;
}