import { BaseApplicationError } from "./base-application-error";

export class RepositoryError extends BaseApplicationError {
  readonly code = "REPOSITORY_ERROR";
  readonly httpStatus = 500;

  constructor(
    module: string,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(module, message, {
      originalError: originalError instanceof Error ? originalError.message : originalError,
    });
  }
}

export class ExternalServiceError extends BaseApplicationError {
  readonly code = "EXTERNAL_SERVICE_ERROR";
  readonly httpStatus = 503;

  constructor(
    module: string,
    service: string,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(module, `${service}: ${message}`, {
      service,
      originalError: originalError instanceof Error ? originalError.message : originalError,
    });
  }
}

export class ValidationError extends BaseApplicationError {
  readonly code = "VALIDATION_ERROR";
  readonly httpStatus = 400;

  constructor(module: string, field: string, message: string, value?: unknown) {
    super(module, `Invalid ${field}: ${message}`, { field, value });
  }
}

export class NotFoundError extends BaseApplicationError {
  readonly code = "NOT_FOUND";
  readonly httpStatus = 404;

  constructor(module: string, resource: string, identifier?: string) {
    super(module, identifier ? `${resource} with identifier ${identifier} not found` : `${resource} not found`, { resource, identifier });
  }
}

export class UnauthorizedError extends BaseApplicationError {
  readonly code = "UNAUTHORIZED";
  readonly httpStatus = 401;

  constructor(module: string, message = "Unauthorized", details?: Record<string, unknown>) {
    super(module, message, details);
  }
}

export class ForbiddenError extends BaseApplicationError {
  readonly code = "FORBIDDEN";
  readonly httpStatus = 403;

  constructor(module: string, message = "Forbidden", details?: Record<string, unknown>) {
    super(module, message, details);
  }
}

export class ConflictError extends BaseApplicationError {
  readonly code = "CONFLICT";
  readonly httpStatus = 409;

  constructor(module: string, resource: string, message: string, details?: Record<string, unknown>) {
    super(module, `${resource}: ${message}`, details);
  }
}

export class InternalSystemError extends BaseApplicationError {
  readonly code = "INTERNAL_SYSTEM_ERROR";
  readonly httpStatus = 500;

  constructor(
    module: string,
    operation: string,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(module, `Internal error in ${operation}: ${message}`, {
      operation,
      originalError: originalError instanceof Error ? originalError.message : originalError,
    });
  }
}
