export class EmailError extends Error {
  constructor(message?: string) {
    super(message ?? "Email sending failed");
    this.name = "EmailError";
    Object.setPrototypeOf(this, EmailError.prototype);
  }
}
