import { NotFoundError } from "@/shared/domain/errors/common-errors";

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super("USER", "User", identifier);
  }
}
