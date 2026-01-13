import { BaseApplicationError } from "@/shared/domain/errors/base-application-error";
import { InvalidAttributeError, UnauthorizedError } from "@/shared/domain/errors/common-errors";

const MODULE_NAME = "AUTH";

export class AccessTokenGenerationError extends BaseApplicationError {
  readonly code = "TOKEN_GENERATION_ERROR";
  readonly httpStatus = 500;

  constructor(reason?: string) {
    super(MODULE_NAME, "Failed to generate AccessToken", { reason });
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor() {
    super(MODULE_NAME, "Invalid or expired refresh token");
  }
}

export class MissingAccessTokenError extends UnauthorizedError {
  constructor() {
    super(MODULE_NAME, "AccessToken is required for this operation");
  }
}

export class AccessTokenError extends UnauthorizedError {
  constructor(message?: string) {
    super(MODULE_NAME, message ?? "Invalid access token");
  }
}

export class AccessTokenExpiredError extends BaseApplicationError {
  readonly code = "ACCESS_TOKEN_EXPIRED";
  readonly httpStatus = 401;

  constructor(message?: string) {
    super(MODULE_NAME, message ?? "Access token has expired");
  }
}

export class InvalidAccessTokenAttributeError extends InvalidAttributeError {
  constructor(property: string, value: unknown, reason?: string) {
    super(MODULE_NAME, property, value, reason);
  }
}
