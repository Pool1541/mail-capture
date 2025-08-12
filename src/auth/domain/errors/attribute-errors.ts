import { ValidationError } from "@/shared/domain/errors/common-errors";

export class InvalidAttributeError extends ValidationError {
  constructor(property: string, value: unknown, reason?: string) {
    const message = reason ? `Invalid ${property}: ${reason}` : `Invalid ${property}`;
    super("AUTH", property, message, value);
  }
}
