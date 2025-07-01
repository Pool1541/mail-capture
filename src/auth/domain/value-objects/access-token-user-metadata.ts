export class AccessTokenUserMetadata {
  public readonly email?: string;
  public readonly emailVerified?: boolean;
  public readonly sub?: string;

  constructor({ email, emailVerified, sub }: { email?: string; emailVerified?: boolean; sub?: string }) {
    this.email = email;
    this.emailVerified = emailVerified;
    this.sub = sub;
  }

  equals(other: AccessTokenUserMetadata): boolean {
    return this.email === other.email && this.emailVerified === other.emailVerified && this.sub === other.sub;
  }
}
