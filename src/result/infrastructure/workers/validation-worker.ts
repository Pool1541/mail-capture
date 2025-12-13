import { type QueueService } from "@/result/domain/contracts/queue-service";
import { type UserRepository } from "@/user/domain/contracts/user-repository";
import { type ResultRepository } from "@/result/domain/contracts/result-repository";
import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";

import { Result } from "@/result/domain/result";
import { UserId } from "@/result/domain/value-objects/user-id";
import { MessageNotFoundError, UnauthorizedSenderError, MessageAlreadyProcessedError } from "@/result/domain/errors";

export class ValidationWorker {
  private intervalId: NodeJS.Timeout | string | number | undefined;

  constructor(
    private readonly validationQueueService: QueueService,
    private readonly scraperQueueService: QueueService,
    private readonly resultRepository: ResultRepository,
    private readonly emailClientService: IEmailClientService,
    private readonly userRepository: UserRepository,
  ) {}

  start() {
    console.log("🔍 Validation worker started, polling for messages every 30 seconds.");

    const intervalId = setInterval(() => {
      this.processMessages().catch((error: unknown) => {
        console.error("Unhandled error in validation worker:", error);
      });
    }, 30000);

    this.intervalId = intervalId;
  }

  stop() {
    clearInterval(this.intervalId);
  }

  private async processMessages(): Promise<void> {
    try {
      const response = await this.validationQueueService.receiveMessages();

      if (response.Messages?.length) {
        for (const message of response.Messages) {
          if (!message.Body) {
            console.warn("Message without body received, skipping...");
            continue;
          }

          let body: { messageId: string };
          console.log("📨 Processing validation message:", message.MessageId);

          try {
            body = JSON.parse(message.Body) as { messageId: string };
          } catch (parseError) {
            console.error("Error parsing message body:", parseError);
            // Eliminar mensaje malformado
            if (message.ReceiptHandle) {
              await this.validationQueueService.deleteMessage(message.ReceiptHandle);
            }
            continue;
          }

          try {
            // Ejecutar lógica de validación
            await this.validateAndQueueForScraping(body.messageId);

            // Eliminar mensaje de la cola de validación
            if (message.ReceiptHandle) {
              await this.validationQueueService.deleteMessage(message.ReceiptHandle);
            }

            console.log(`✅ Message ${body.messageId} validated and queued for scraping`);
          } catch (error) {
            if (error instanceof MessageAlreadyProcessedError) {
              console.warn("Message already processed:", error.message);
              // Eliminar mensaje duplicado
              if (message.ReceiptHandle) {
                await this.validationQueueService.deleteMessage(message.ReceiptHandle);
              }
            } else if (error instanceof UnauthorizedSenderError) {
              console.warn("Unauthorized sender:", error.message);
              // Eliminar mensaje de sender no autorizado
              if (message.ReceiptHandle) {
                await this.validationQueueService.deleteMessage(message.ReceiptHandle);
              }
            } else if (error instanceof MessageNotFoundError) {
              console.error("Message not found:", error.message);
              // Eliminar referencia a mensaje inexistente
              if (message.ReceiptHandle) {
                await this.validationQueueService.deleteMessage(message.ReceiptHandle);
              }
            } else {
              console.error("Error processing validation message:", error);
              // No eliminar - dejar que reintente (o vaya a DLQ después de max attempts)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in validation worker:", error);
    }
  }

  private async validateAndQueueForScraping(messageId: string): Promise<void> {
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
      emailClient: message.sender.emailAddress.address.includes("hotmail") ? "hotmail" : "gmail",
      messageId: message.id,
      userId: new UserId(user.requireId().getValue()),
    });

    await this.resultRepository.save(newResult);

    // 5. Enviar a la cola de scraping
    await this.scraperQueueService.sendMessage({
      messageId: message.id,
      sender: message.sender.emailAddress.address,
      subject: message.subject,
    });
  }
}
