import jwt from "jsonwebtoken";

import type { AccessTokenPayload, IJwtService } from "../../domain/contracts/jwt-service";

import { AccessToken } from "../../domain/access-token";
import { InternalSystemError } from "@/shared/domain/errors";
import { AccessTokenError, AccessTokenExpiredError } from "@/auth/domain/errors";

export async function jwtVerify<T>(token: string, secret: string): Promise<T> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded as T);
    });
  });
}

export class JwtService implements IJwtService {
  constructor(private readonly secret: string) {}

  async verify(token: string): Promise<AccessToken> {
    try {
      const payload = await jwtVerify<AccessTokenPayload>(token, this.secret);
      const accessToken = this.mapPayloadToAccessToken(payload);
      return accessToken;
    } catch (error) {
      this.handleJsonWebTokenError(error);
    }
  }

  private handleJsonWebTokenError(error: unknown): never {
    if (error instanceof jwt.JsonWebTokenError) throw new AccessTokenError(error.message);
    if (error instanceof jwt.TokenExpiredError) throw new AccessTokenExpiredError(error.message);
    if (error instanceof jwt.NotBeforeError) throw new AccessTokenError(error.message);

    throw new InternalSystemError("AUTH", "JWT verification", "Unexpected internal error during token verification", error);
  }

  private mapPayloadToAccessToken(payload: AccessTokenPayload): AccessToken {
    return AccessToken.fromPayload({
      email: payload.email,
      exp: payload.exp,
      iat: payload.iat,
      role: payload.role,
      userMetadata: {
        email: payload.user_metadata.email,
        emailVerified: payload.user_metadata.email_verified,
        sub: payload.user_metadata.sub,
      },
    });
  }
}
