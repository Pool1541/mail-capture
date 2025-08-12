import { BaseApplicationError } from "@/shared/domain/errors/base-application-error";
import { UnauthorizedError } from "@/shared/domain/errors/common-errors";

export class AccessTokenGenerationError extends BaseApplicationError {
  readonly code = "TOKEN_GENERATION_ERROR";
  readonly httpStatus = 500;

  constructor(reason?: string) {
    super("AUTH", "Failed to generate AccessToken", { reason });
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor() {
    super("AUTH", "Invalid or expired refresh token");
  }
}

export class MissingAccessTokenError extends UnauthorizedError {
  constructor() {
    super("AUTH", "AccessToken is required for this operation");
  }
}

export class AccessTokenError extends UnauthorizedError {
  constructor(message?: string) {
    super("AUTH", message ?? "Invalid access token");
  }
}

export class AccessTokenExpiredError extends BaseApplicationError {
  readonly code = "ACCESS_TOKEN_EXPIRED";
  readonly httpStatus = 401;

  constructor(message?: string) {
    super("AUTH", message ?? "Access token has expired");
  }
}
