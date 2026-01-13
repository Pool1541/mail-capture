import { ForbiddenError } from "@/shared/domain/errors/common-errors";

export class UnauthorizedSenderError extends ForbiddenError {
  constructor(sender?: string) {
    super("RESULT", sender ? `Unauthorized sender: ${sender}` : "Unauthorized sender", { sender });
  }
}
