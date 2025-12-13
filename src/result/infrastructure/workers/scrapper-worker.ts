import { runScrapper } from "../services/scrapper-service";
import { type QueueService } from "@/result/domain/contracts/queue-service";
import { type ScraperQueueMessageBody } from "@/result/domain/contracts/queue-message";

export class ScrapperWorker {
  private intervalId: NodeJS.Timeout | string | number | undefined;

  constructor(private readonly scraperQueueService: QueueService) {}

  start() {
    console.log("🎨 Scraper worker started, polling for messages every 30 seconds.");

    const intervalId = setInterval(() => {
      this.processMessages().catch((error: unknown) => {
        console.error("Unhandled error in scraper worker:", error);
      });
    }, 30000);

    this.intervalId = intervalId;
  }

  stop() {
    clearInterval(this.intervalId);
  }

  private async processMessages(): Promise<void> {
    try {
      const response = await this.scraperQueueService.receiveMessages();

      if (response.Messages?.length) {
        for (const message of response.Messages) {
          if (!message.Body) {
            console.warn("Message without body received, skipping...");
            continue;
          }

          let body: ScraperQueueMessageBody;
          console.log("🎬 Processing scraper message:", message.MessageId);

          try {
            body = JSON.parse(message.Body) as ScraperQueueMessageBody;
          } catch (parseError) {
            console.error("Error parsing message body:", parseError);
            // Eliminar mensaje malformado
            if (message.ReceiptHandle) {
              await this.scraperQueueService.deleteMessage(message.ReceiptHandle);
            }
            continue;
          }

          try {
            // Ejecutar scraping con Playwright
            await runScrapper(body);

            // Eliminar mensaje después de scraping exitoso
            if (message.ReceiptHandle) {
              await this.scraperQueueService.deleteMessage(message.ReceiptHandle);
            }

            console.log(`✅ Scraping completed for message ${body.messageId}`);
          } catch (error) {
            console.error("Error processing scraper message:", error);
            // No eliminar - dejar que reintente o vaya a DLQ
          }
        }
      }
    } catch (error) {
      console.error("Error in scraper worker:", error);
    }
  }
}

// export function startScrapperWorker() {
//   console.log("Scrapper worker started, polling for messages every 30 seconds.");
//   const processMessages = async (): Promise<void> => {
//     try {
//       const response = await recieveMessageCommand();

//       if (response.Messages?.length) {
//         for (const message of response.Messages) {
//           // Validar que el mensaje tenga body
//           if (!message.Body) {
//             console.warn("Message without body received, skipping...");
//             continue;
//           }

//           let body: unknown;
//           console.log("Processing message:", message);
//           try {
//             body = JSON.parse(message.Body) as unknown;
//           } catch (parseError) {
//             console.error("Error parsing message body:", parseError);
//             // Eliminar mensaje malformado para evitar procesamiento infinito
//             if (message.ReceiptHandle) {
//               await deleteMessageCommand(message.ReceiptHandle);
//             }
//             continue;
//           }

//           try {
//             await runScrapper(body);

//             // Solo eliminar si tiene ReceiptHandle
//             if (message.ReceiptHandle) {
//               await deleteMessageCommand(message.ReceiptHandle);
//             }
//           } catch (error) {
//             console.error("Error processing message:", error);
//             // Considerar implementar dead letter queue o retry logic aquí
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error in scrapper worker:", error);
//     }
//   };

//   const intervalId = setInterval(() => {
//     processMessages().catch((error: unknown) => {
//       console.error("Unhandled error in message processing:", error);
//     });
//   }, 30000);

//   // Retornar el ID del intervalo para poder detenerlo
//   return intervalId;
// }

// export function stopScrapperWorker(intervalId: NodeJS.Timeout): void {
//   clearInterval(intervalId);
// }
