import { NotFoundError } from "@/shared/domain/errors/common-errors";

export class MessageNotFoundError extends NotFoundError {
  constructor(messageId?: string) {
    super("RESULT", "Message", messageId);
  }
}
