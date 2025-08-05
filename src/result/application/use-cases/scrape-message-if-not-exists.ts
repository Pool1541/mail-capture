import { type QueueService } from "@/result/domain/contracts/queue-service";
import { type UserRepository } from "@/user/domain/contracts/user-repository";
import { type ResultRepository } from "@/result/domain/contracts/result-repository";
import { type QueueMessageBody } from "@/result/domain/contracts/queue-message";
import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";

import { Result } from "@/result/domain/result";
import { UserId } from "@/result/domain/value-objects/user-id";
import { MessageNotFoundError } from "@/result/domain/errors/message-not-found-error";
import { UnauthorizedSenderError } from "@/result/domain/errors/unauthorized-sender-error";
import { MessageAlreadyProcessedError } from "@/result/domain/errors/message-already-processed-error";

export class ScrapeMessageIfNotExists {
  constructor(
    private readonly resultRepository: ResultRepository,
    private readonly emailClientService: IEmailClientService,
    private readonly userRepository: UserRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute(messageId: string): Promise<void> {
    const result = await this.resultRepository.findByMessageId(messageId);

    if (result) throw new MessageAlreadyProcessedError(messageId);

    const message = await this.emailClientService.getMessageById(messageId);

    if (!message) throw new MessageNotFoundError();

    const user = await this.userRepository.findByEmail(message.sender.emailAddress.address);

    if (!user) {
      throw new UnauthorizedSenderError();
    }

    const newResult = Result.create({
      emailClient: message.sender.emailAddress.address.includes("hotmail") ? "hotmail" : "gmail",
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
  }
}
