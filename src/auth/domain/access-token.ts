import { AccessTokenId } from "./value-objects/access-token-id";
import { AccessTokenExp } from "./value-objects/access-token-exp";
import { AccessTokenIat } from "./value-objects/access-token-iat";
import { AccessTokenRole } from "./value-objects/access-token-role";
import { AccessTokenEmail } from "./value-objects/access-token-email";
import { AccessTokenUserMetadata } from "./value-objects/access-token-user-metadata";
import { AccessTokenExpiredError } from "./errors/access-token-expired";

export class AccessToken {
  private readonly id: AccessTokenId;
  private readonly email: AccessTokenEmail;
  private readonly exp: AccessTokenExp;
  private readonly iat: AccessTokenIat;
  private readonly role: AccessTokenRole;
  private readonly userMetadata: AccessTokenUserMetadata;

  constructor({
    id,
    email,
    exp,
    iat,
    role,
    userMetadata,
  }: {
    id: AccessTokenId;
    email: AccessTokenEmail;
    exp: AccessTokenExp;
    iat: AccessTokenIat;
    role: AccessTokenRole;
    userMetadata: AccessTokenUserMetadata;
  }) {
    this.id = id;
    this.email = email;
    this.exp = exp;
    this.iat = iat;
    this.role = role;
    this.userMetadata = userMetadata;
  }

  ensureNotExpired(): void {
    if (AccessTokenExp.isExpired(this.exp.getValue().getTime())) {
      throw new AccessTokenExpiredError();
    }
  }

  getId(): AccessTokenId {
    return this.id;
  }

  getEmail(): AccessTokenEmail {
    return this.email;
  }

  getExp(): AccessTokenExp {
    return this.exp;
  }

  getIat(): AccessTokenIat {
    return this.iat;
  }

  getRole(): AccessTokenRole {
    return this.role;
  }

  getUserMetadata(): AccessTokenUserMetadata {
    return this.userMetadata;
  }

  toJSON(): object {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      exp: this.exp.getValue(),
      iat: this.iat.getValue(),
      role: this.role.getValue(),
      userMetadata: this.userMetadata,
    };
  }

  static fromPayload(payload: { email: string; exp: number; iat: number; role: string; userMetadata: Record<string, unknown> }): AccessToken {
    return new AccessToken({
      id: new AccessTokenId(crypto.randomUUID()),
      email: new AccessTokenEmail(payload.email),
      exp: new AccessTokenExp(payload.exp),
      iat: new AccessTokenIat(payload.iat),
      role: new AccessTokenRole(payload.role),
      userMetadata: new AccessTokenUserMetadata(payload.userMetadata),
    });
  }
}
