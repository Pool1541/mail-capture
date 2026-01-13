export class InvalidEmailFormatError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid email format");
    this.name = "InvalidEmailFormatError";
    Object.setPrototypeOf(this, InvalidEmailFormatError.prototype);
  }
}
