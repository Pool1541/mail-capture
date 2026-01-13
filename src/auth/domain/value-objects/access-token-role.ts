import { InvalidAccessTokenAttributeError } from "../errors";

export class AccessTokenRole {
  private readonly value: string;

  constructor(value: string) {
    if (!value) throw new InvalidAccessTokenAttributeError("role", value, "cannot be empty");
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccessTokenRole): boolean {
    return this.value === other.getValue();
  }
}
