export class InvalidEmailClientError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid email format");
    this.name = "InvalidEmailClientError";
    Object.setPrototypeOf(this, InvalidEmailClientError.prototype);
  }
}
