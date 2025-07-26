export class MessageAlreadyProcessedError extends Error {
  constructor(messageId: string) {
    super(`Message ${messageId} already processed`);
    this.name = "MessageAlreadyProcessedError";
    Object.setPrototypeOf(this, MessageAlreadyProcessedError.prototype);
  }
}
