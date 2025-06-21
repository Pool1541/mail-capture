export class UserError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid User");
    this.name = "UserError";
    Object.setPrototypeOf(this, UserError.prototype);
  }
}
