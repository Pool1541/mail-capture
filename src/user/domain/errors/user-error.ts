import { BaseApplicationError } from "@/shared/domain/errors/base-application-error";

export class UserError extends BaseApplicationError {
  readonly code = "INVALID_USER";
  readonly httpStatus = 400;

  constructor(message?: string) {
    super("USER", message ?? "Invalid User");
  }
}
