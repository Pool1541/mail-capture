import { AccessTokenError } from "../errors/access-token-error";

export class AccessTokenRole {
  private readonly value: string;

  constructor(value: string) {
    if (!value) throw new AccessTokenError("Role cannot be empty");
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccessTokenRole): boolean {
    return this.value === other.getValue();
  }
}
