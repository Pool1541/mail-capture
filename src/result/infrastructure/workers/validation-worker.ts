/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { type QueueService } from "@/result/domain/contracts/queue-service";
import { type UserRepository } from "@/user/domain/contracts/user-repository";
import { type ResultRepository } from "@/result/domain/contracts/result-repository";
import type { MessageData, IEmailClientService } from "@/result/domain/contracts/email-client-service";

import * as Sentry from "@sentry/node";

import { MessageNotFoundError, UnauthorizedSenderError, MessageAlreadyProcessedError } from "@/result/domain/errors";
import { ScraperQueueMessageBody } from "@/result/domain/contracts/queue-message";
import { SentryLogger } from "@/shared/infrastructure/services/sentry-logger";
import { Result } from "@/result/domain/result";

const logger = new SentryLogger(Sentry.logger);

export class ValidationWorker {
  private keepRunning = false;

  constructor(
    private readonly validationQueueService: QueueService,
    private readonly scraperQueueService: QueueService<ScraperQueueMessageBody>,
    private readonly resultRepository: ResultRepository,
    private readonly emailClientService: IEmailClientService,
    private readonly userRepository: UserRepository,
  ) {}

  async start() {
    console.log("🔍 Validation worker started");

    this.keepRunning = true;

    while (this.keepRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        logger.error("Unhandled error in validation worker main loop:", { error });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.keepRunning = false;
  }

  private async processMessages(): Promise<void> {
    try {
      const response = await this.validationQueueService.receiveMessages();

      if (response.Messages?.length) {
        for (const message of response.Messages) {
          if (!message.Body) {
            logger.warn("Message without body received, skipping...", { queueMessageId: message.MessageId });
            continue;
          }

          let body: { messageId: string };
          console.log("📨 Processing validation message:", message.MessageId);

          try {
            body = JSON.parse(message.Body) as { messageId: string };
          } catch (parseError) {
            logger.warn("Error parsing message body:", { error: parseError, queueMessageId: message.MessageId });
            // Eliminar mensaje malformado
            if (message.ReceiptHandle) {
              await this.validationQueueService.deleteMessage(message.ReceiptHandle);
            }
            continue;
          }

          try {
            // Ejecutar lógica de validación
            const emailMessage = await this.validateAndQueueForScraping(body.messageId);

            // Eliminar mensaje de la cola de validación
            if (message.ReceiptHandle) {
              await this.validationQueueService.deleteMessage(message.ReceiptHandle);
            }

            logger.info(`✅ Message validated and queued for scraping`, {
              messageId: emailMessage.id,
              subject: emailMessage.subject,
              sender: emailMessage.sender.emailAddress.address,
              queueMessageId: message.MessageId,
            });
          } catch (error) {
            if (error instanceof MessageAlreadyProcessedError) {
              logger.warn("Message already processed:", { message: error.message, messageId: body.messageId });
              // Eliminar mensaje duplicado
              if (message.ReceiptHandle) {
                await this.validationQueueService.deleteMessage(message.ReceiptHandle);
              }
            } else if (error instanceof UnauthorizedSenderError) {
              logger.warn("Unauthorized sender:", { message: error.message, sender: error.details?.sender });
              // Eliminar mensaje de sender no autorizado
              if (message.ReceiptHandle) {
                await this.validationQueueService.deleteMessage(message.ReceiptHandle);
              }
            } else if (error instanceof MessageNotFoundError) {
              logger.error("Message not found:", { message: error.message, messageId: message.MessageId });
              // Eliminar referencia a mensaje inexistente
              if (message.ReceiptHandle) {
                await this.validationQueueService.deleteMessage(message.ReceiptHandle);
              }
            } else {
              logger.error("Error processing validation message:", { error, messageId: message.MessageId });
              // No eliminar - dejar que reintente (o vaya a DLQ después de max attempts)
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error in validation worker:", { error });
    }
  }

  private async validateAndQueueForScraping(messageId: string): Promise<MessageData> {
    // 1. Verificar si ya fue procesado
    const existingResult = await this.resultRepository.findByMessageId(messageId);
    if (existingResult) {
      throw new MessageAlreadyProcessedError(messageId);
    }

    // 2. Obtener mensaje del email client
    const message = await this.emailClientService.getMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    // 3. Validar que el sender esté autorizado
    const user = await this.userRepository.findByEmail(message.sender.emailAddress.address);
    if (!user) {
      throw new UnauthorizedSenderError(message.sender.emailAddress.address);
    }

    // 4. Crear y guardar resultado en BD
    const newResult = Result.create({
      email: message.sender.emailAddress.address,
      messageId: message.id,
      userId: user.requireId(),
    });

    await this.resultRepository.save(newResult);

    // 5. Enviar a la cola de scraping
    await this.scraperQueueService.sendMessage({
      messageId: message.id,
      sender: message.sender.emailAddress.address,
      subject: message.subject,
      uid: user.requireId().getValue(),
    });

    return message;
  }
}
