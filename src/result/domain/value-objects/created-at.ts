import { ResultError } from "../errors/result-error";

export class ResultCreatedAt {
  private value: Date;

  constructor(value?: string | Date | number) {
    this.value = ResultCreatedAt.normalizeDate(value ?? new Date());
  }

  static normalizeDate(value: string | Date | number): Date {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new ResultError("createdAt", "Invalid type for createdAt, must be Date, string or timestamp");
    }

    if (isNaN(date.getTime())) {
      throw new ResultError("createdAt", "Invalid date value provided to createdAt");
    }

    return date;
  }

  getValue(): Date {
    return this.value;
  }

  isBefore(other: ResultCreatedAt): boolean {
    return this.value.getTime() < other.getValue().getTime();
  }

  isAfter(other: ResultCreatedAt): boolean {
    return this.value.getTime() > other.getValue().getTime();
  }

  equals(other: ResultCreatedAt): boolean {
    return this.value.getTime() === other.getValue().getTime();
  }

  public toISOString(): string {
    return this.value.toISOString();
  }
}
