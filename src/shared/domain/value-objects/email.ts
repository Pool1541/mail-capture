import { InvalidEmailFormatError } from "../errors/invalid-email";

export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!Email.isValidEmail(value)) {
      throw new InvalidEmailFormatError();
    }
    this.value = value;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.getValue();
  }
}
