import jwt from "jsonwebtoken";

import type { AccessTokenPayload, IJwtService } from "../../domain/contracts/jwt-service";

import { AccessToken } from "../../domain/access-token";

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
      if (error instanceof Error) {
        console.log(error.message);
        throw new Error(`JWT verification failed: ${error.message}`);
      }
      throw new Error("JWT verification failed: Unknown error");
    }
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
