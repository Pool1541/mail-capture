import { AccessToken } from "@/auth/domain/access-token";
import { IJwtService } from "@/auth/domain/contracts/jwt-service";

export class ValidateAccessToken {
  constructor(private readonly jwtService: IJwtService) {}

  async execute(token: string): Promise<AccessToken> {
    const accessToken = await this.jwtService.verify(token);
    accessToken.ensureNotExpired();

    return accessToken;
  }
}
