import { UnauthorizedError, ForbiddenError } from "@/shared/domain/errors/common-errors";

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("AUTH", "Invalid email or password");
  }
}

export class AccountLockedError extends ForbiddenError {
  constructor(unlockTime?: Date) {
    super("AUTH", "Account is temporarily locked due to too many failed attempts", { unlockTime });
  }
}

export class InsufficientPermissionsError extends ForbiddenError {
  constructor(requiredPermission: string) {
    super("AUTH", "Insufficient permissions to perform this action", { requiredPermission });
  }
}
