import { type QueueService } from "@/result/domain/contracts/queue-service";
import { type UserRepository } from "@/user/domain/contracts/user-repository";
import { type ResultRepository } from "@/result/domain/contracts/result-repository";
import { type QueueMessageBody } from "@/result/domain/contracts/queue-message";
import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";

import { Result } from "@/result/domain/result";
import { UserId } from "@/result/domain/value-objects/user-id";
import { ExternalServiceError } from "@/shared/domain/errors/common-errors";
import { MessageNotFoundError, UnauthorizedSenderError, MessageAlreadyProcessedError } from "@/result/domain/errors";

export class ScrapeMessageIfNotExists {
  constructor(
    private readonly resultRepository: ResultRepository,
    private readonly emailClientService: IEmailClientService,
    private readonly userRepository: UserRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute(messageId: string): Promise<void> {
    try {
      const result = await this.resultRepository.findByMessageId(messageId);

      if (result) throw new MessageAlreadyProcessedError(messageId);

      const message = await this.emailClientService.getMessageById(messageId);

      if (!message) throw new MessageNotFoundError(messageId);

      const user = await this.userRepository.findByEmail(message.sender.emailAddress.address);

      if (!user) {
        throw new UnauthorizedSenderError(message.sender.emailAddress.address);
      }

      const newResult = Result.create({
        email: message.sender.emailAddress.address,
        messageId: message.id,
        userId: new UserId(user.requireId().getValue()),
      });

      const messageString: QueueMessageBody = {
        messageId: message.id,
        sender: message.sender.emailAddress.address,
        subject: message.subject,
      };

      await this.resultRepository.save(newResult);
      await this.queueService.sendMessage(messageString);
    } catch (error) {
      // Re-lanzar errores conocidos del dominio
      if (error instanceof MessageAlreadyProcessedError || error instanceof MessageNotFoundError || error instanceof UnauthorizedSenderError) {
        throw error;
      }

      // Envolver errores inesperados
      throw new ExternalServiceError("RESULT", "ScrapeMessageIfNotExists", "Failed to process message", error);
    }
  }
}
