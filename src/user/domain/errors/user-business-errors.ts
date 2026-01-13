import { BaseApplicationError } from "@/shared/domain/errors/base-application-error";
import { ConflictError, ValidationError } from "@/shared/domain/errors/common-errors";

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super("USER", "User", `User with email ${email} already exists`, { email });
  }
}

export class InvalidEmailError extends ValidationError {
  constructor(email: string) {
    super("USER", "email", "Invalid email format", email);
  }
}

export class InvalidUserAgeError extends ValidationError {
  constructor(age: number) {
    super("USER", "age", "Age must be between 13 and 120", age);
  }
}

export class UserDeactivatedError extends BaseApplicationError {
  readonly code = "USER_DEACTIVATED";
  readonly httpStatus = 403;

  constructor(userId: string) {
    super("USER", "User account is deactivated", { userId });
  }
}
