import { UserError } from "../errors/user-error";

export class UserUpdatedAt {
  private value: Date;

  constructor(value?: string | Date | number) {
    this.value = UserUpdatedAt.normalizeDate(value ?? new Date());
  }

  static normalizeDate(value: string | Date | number): Date {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new UserError('Invalid type for "updatedAt" attribute, must be Date, string or timestamp');
    }

    if (isNaN(date.getTime())) {
      throw new UserError('Invalid date value provided to "updatedAt" attribute');
    }

    return date;
  }

  getValue(): Date {
    return this.value;
  }

  isBefore(other: UserUpdatedAt): boolean {
    return this.value.getTime() < other.getValue().getTime();
  }

  isAfter(other: UserUpdatedAt): boolean {
    return this.value.getTime() > other.getValue().getTime();
  }

  equals(other: UserUpdatedAt): boolean {
    return this.value.getTime() === other.getValue().getTime();
  }

  public toISOString(): string {
    return this.value.toISOString();
  }
}
