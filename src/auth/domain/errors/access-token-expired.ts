export class AccessTokenExpiredError extends Error {
  constructor(message?: string) {
    super(message ?? "Access token has expired");
    this.name = "AccessTokenExpiredError";
    Object.setPrototypeOf(this, AccessTokenExpiredError.prototype);
  }
}
