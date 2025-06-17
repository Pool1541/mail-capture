/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserError } from "../errors/user-error";

export class UserAvatar {
  private readonly value: string;

  constructor(value: string) {
    UserAvatar.ensureIsValid(value);
    this.value = value;
  }

  static ensureIsValid(value: string): void {
    if (!value.trim()) throw new UserError(`UserAvatar is required`);
    try {
      new URL(value);
    } catch (error) {
      throw new UserError(`Invalid UserAvatar URL: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserAvatar): boolean {
    return this.value === other.getValue();
  }
}
