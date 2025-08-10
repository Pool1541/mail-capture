export class InvalidIdError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid id");
    this.name = "InvalidIdError";
    Object.setPrototypeOf(this, InvalidIdError.prototype);
  }
}
