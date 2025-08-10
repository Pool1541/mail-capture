import { runScrapper } from "../services/scrapper-service";
import { deleteMessageCommand, recieveMessageCommand } from "../aws/sqs-commands";

export class ScrapperWorker {
  private intervalId: NodeJS.Timeout | string | number | undefined;

  start() {
    const intervalId = setInterval(() => {
      this.processMessages().catch((error: unknown) => {
        console.error("Unhandled error in message processing:", error);
      });
    }, 30000);

    this.intervalId = intervalId;
  }

  stop() {
    clearInterval(this.intervalId);
  }

  private async processMessages(): Promise<void> {
    try {
      const response = await recieveMessageCommand();

      if (response.Messages?.length) {
        for (const message of response.Messages) {
          // Validar que el mensaje tenga body
          if (!message.Body) {
            console.warn("Message without body received, skipping...");
            continue;
          }

          let body: unknown;
          console.log("Processing message:", message);
          try {
            body = JSON.parse(message.Body) as unknown;
          } catch (parseError) {
            console.error("Error parsing message body:", parseError);
            // Eliminar mensaje malformado para evitar procesamiento infinito
            if (message.ReceiptHandle) {
              await deleteMessageCommand(message.ReceiptHandle);
            }
            continue;
          }

          try {
            await runScrapper(body);

            // Solo eliminar si tiene ReceiptHandle
            if (message.ReceiptHandle) {
              await deleteMessageCommand(message.ReceiptHandle);
            }
          } catch (error) {
            console.error("Error processing message:", error);
            // Considerar implementar dead letter queue o retry logic aquí
          }
        }
      }
    } catch (error) {
      console.error("Error in scrapper worker:", error);
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
