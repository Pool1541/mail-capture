import { AccessTokenError } from "../errors/access-token-error";

export class AccessTokenIat {
  private value: Date;

  constructor(value?: string | Date | number) {
    this.value = AccessTokenIat.normalizeDate(value ?? new Date());
  }

  static normalizeDate(value: string | Date | number): Date {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new AccessTokenError("Invalid type for Iat, must be Date, string or timestamp");
    }

    if (isNaN(date.getTime())) {
      throw new AccessTokenError("Invalid date value provided to Iat");
    }

    return date;
  }

  getValue(): Date {
    return this.value;
  }

  isBefore(other: AccessTokenIat): boolean {
    return this.value.getTime() < other.getValue().getTime();
  }

  isAfter(other: AccessTokenIat): boolean {
    return this.value.getTime() > other.getValue().getTime();
  }

  equals(other: AccessTokenIat): boolean {
    return this.value.getTime() === other.getValue().getTime();
  }

  public toISOString(): string {
    return this.value.toISOString();
  }
}
