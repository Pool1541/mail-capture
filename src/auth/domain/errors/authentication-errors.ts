import { UnauthorizedError, ForbiddenError } from "@/shared/domain/errors/common-errors";

const MODULE_NAME = "AUTH";

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super(MODULE_NAME, "Invalid email or password");
  }
}

export class AccountLockedError extends ForbiddenError {
  constructor(unlockTime?: Date) {
    super(MODULE_NAME, "Account is temporarily locked due to too many failed attempts", { unlockTime });
  }
}

export class InsufficientPermissionsError extends ForbiddenError {
  constructor(requiredPermission: string) {
    super(MODULE_NAME, "Insufficient permissions to perform this action", { requiredPermission });
  }
}
