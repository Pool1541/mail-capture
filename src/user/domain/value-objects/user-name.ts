import { UserError } from "../errors/user-error";

export class UserName {
  private readonly value: string;

  constructor(value: string) {
    UserName.ensureIsValid(value);
    this.value = value;
  }

  static ensureIsValid(value: string): void {
    if (value.length < 3 || value.length > 50) {
      throw new UserError(`Invalid UserName: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserName): boolean {
    return this.value === other.getValue();
  }
}
