import { ValidationError } from "@/shared/domain/errors/common-errors";

export class ResultError extends ValidationError {
  constructor(field: string, message?: string) {
    super("RESULT", field, message ?? "Invalid Result");
  }
}
