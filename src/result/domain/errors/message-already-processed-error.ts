import { ConflictError } from "@/shared/domain/errors/common-errors";

export class MessageAlreadyProcessedError extends ConflictError {
  constructor(messageId: string) {
    super("RESULT", "Message", `Message ${messageId} already processed`, { messageId });
  }
}
