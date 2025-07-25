export class ResultError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid Result");
    this.name = "ResultError";
    Object.setPrototypeOf(this, ResultError.prototype);
  }
}
