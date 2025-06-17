import { UserError } from "../errors/user-error";

export class UserCreatedAt {
  private value: Date;

  constructor(value?: string | Date | number) {
    this.value = UserCreatedAt.normalizeDate(value ?? new Date());
  }

  static normalizeDate(value: string | Date | number): Date {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new UserError("Invalid type for createdAt, must be Date, string or timestamp");
    }

    if (isNaN(date.getTime())) {
      throw new UserError("Invalid date value provided to createdAt");
    }

    return date;
  }

  getValue(): Date {
    return this.value;
  }

  isBefore(other: UserCreatedAt): boolean {
    return this.value.getTime() < other.getValue().getTime();
  }

  isAfter(other: UserCreatedAt): boolean {
    return this.value.getTime() > other.getValue().getTime();
  }

  equals(other: UserCreatedAt): boolean {
    return this.value.getTime() === other.getValue().getTime();
  }

  public toISOString(): string {
    return this.value.toISOString();
  }
}
