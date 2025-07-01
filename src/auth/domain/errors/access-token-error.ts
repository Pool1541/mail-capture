export class AccessTokenError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid access token");
    this.name = "AccessTokenError";
    Object.setPrototypeOf(this, AccessTokenError.prototype);
  }
}
