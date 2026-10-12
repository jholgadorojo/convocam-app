
import type { UserProfileDto } from "./user-profile.dto";

export type GetUserProfileResultDto = UserProfileDto & {
  residenceMunicipalityId: number | null;
};
