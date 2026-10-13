
import { UserProfile } from "../../domain/user-profile";

import type { UserProfileRepository } from
  "../repositories/user-profile.repository";

type EnsureUserProfileInput = {
  userId: string;
  registeredName: string;
};

export class EnsureUserProfile {
  constructor(
    private readonly repository: UserProfileRepository,
  ) {}

  async execute(input: EnsureUserProfileInput): Promise<void> {
    const userId = input.userId.trim();

    // No modificar un perfil que ya existe
    const existing = await this.repository.findByUserId(
      userId,
    );

    if (existing) {
      return;
    }

    const profile = UserProfile.createForRegistration({
      userId,
      name: input.registeredName,
    });

    try {
      await this.repository.save(profile);
    } catch (error) {
      // Evitar errores si dos solicitudes intentan
      // crear simultáneamente el mismo perfil.
      const created = await this.repository.findByUserId(
        userId,
      );

      if (created) {
        return;
      }

      throw error;
    }
  }
}
