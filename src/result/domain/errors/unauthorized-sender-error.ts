export class UnauthorizedSenderError extends Error {
  constructor(message?: string) {
    super(message ?? "Unauthorized sender");
    this.name = "UnauthorizedSenderError";
    Object.setPrototypeOf(this, UnauthorizedSenderError.prototype);
  }
}
