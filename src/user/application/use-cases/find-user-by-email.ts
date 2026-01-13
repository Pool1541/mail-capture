import { type UserRepository } from "../../domain/contracts/user-repository";
import { type UserResponseDTO } from "../dtos/user-response.dto";

import { UserNotFoundError } from "../../domain/errors/user-not-found";

export class FindUserByEmail {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(email: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundError();
    }

    return {
      id: user.requireId().getValue(),
      email: user.getEmail().getValue(),
      name: user.getName()?.getValue(),
      avatar: user.getAvatar()?.getValue(),
      createdAt: user.getCreatedAt().getValue(),
      updatedAt: user.getUpdatedAt().getValue(),
    };
  }
}
