import { AccessToken } from "../access-token";

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  user_metadata: UserMetadata;
}

export interface UserMetadata {
  email?: string;
  email_verified?: boolean;
  sub: string;
}

export interface IJwtService {
  verify(token: string): Promise<AccessToken>;
}
