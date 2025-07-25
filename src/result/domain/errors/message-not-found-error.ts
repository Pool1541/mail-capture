export class MessageNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? "Message not found");
    this.name = "MessageNotFoundError";
    Object.setPrototypeOf(this, MessageNotFoundError.prototype);
  }
}
