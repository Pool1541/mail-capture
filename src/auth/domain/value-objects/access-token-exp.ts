import { AccessTokenError } from "../errors/access-token-error";
import { AccessTokenExpiredError } from "../errors/access-token-expired";

export class AccessTokenExp {
  private value: Date;

  constructor(value?: string | Date | number) {
    this.value = AccessTokenExp.normalizeDate(value ?? new Date());
    const isExpired = AccessTokenExp.isExpired(this.value.getTime());

    if (isExpired) {
      throw new AccessTokenExpiredError();
    }
  }

  static normalizeDate(value: string | Date | number): Date {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new AccessTokenError('Invalid type for "exp" attribute, must be Date, string or timestamp');
    }

    if (isNaN(date.getTime())) {
      throw new AccessTokenError('Invalid date value provided to "exp" attribute');
    }

    return date;
  }

  static isExpired(value: number): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return value <= currentTime;
  }

  getValue(): Date {
    return this.value;
  }

  isBefore(other: AccessTokenExp): boolean {
    return this.value.getTime() < other.getValue().getTime();
  }

  isAfter(other: AccessTokenExp): boolean {
    return this.value.getTime() > other.getValue().getTime();
  }

  equals(other: AccessTokenExp): boolean {
    return this.value.getTime() === other.getValue().getTime();
  }

  public toISOString(): string {
    return this.value.toISOString();
  }
}
