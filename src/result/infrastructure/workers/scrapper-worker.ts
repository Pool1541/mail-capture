/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { type QueueService } from "@/result/domain/contracts/queue-service";
import { type ScraperQueueMessageBody } from "@/result/domain/contracts/queue-message";

import { readFileSync } from "node:fs";
import * as Sentry from "@sentry/node";
import { randomUUID } from "node:crypto";
import { runScrapper } from "../services/scrapper-service";
import { createClient } from "@supabase/supabase-js";
import { SentryLogger } from "@/shared/infrastructure/services/sentry-logger";
import { NotFoundError } from "@/shared/domain/errors";
import { UserRepository } from "@/user/domain/contracts/user-repository";
import { ResultRepository } from "@/result/domain/contracts/result-repository";

const supabase = createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE ?? "");

const logger = new SentryLogger(Sentry.logger);

export class ScrapperWorker {
  private keepRunning = false;

  constructor(
    private readonly scraperQueueService: QueueService,
    private readonly resultRepository: ResultRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async start() {
    console.log("🎨 Scraper worker started");

    this.keepRunning = true;

    while (this.keepRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        logger.error("Unhandled error in scraper worker main loop:", { error });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.keepRunning = false;
  }

  private async processMessages(): Promise<void> {
    try {
      const response = await this.scraperQueueService.receiveMessages();

      if (response.Messages?.length) {
        for (const message of response.Messages) {
          if (!message.Body) {
            logger.warn("Message without body received, skipping...", { queueMessageId: message.MessageId });
            continue;
          }

          let body: ScraperQueueMessageBody;
          console.log("🎬 Processing scraper message:", message.MessageId);

          try {
            body = JSON.parse(message.Body) as ScraperQueueMessageBody;
          } catch (parseError) {
            logger.warn("Error parsing message body:", { error: parseError, queueMessageId: message.MessageId });
            // Eliminar mensaje malformado
            if (message.ReceiptHandle) {
              await this.scraperQueueService.deleteMessage(message.ReceiptHandle);
            }
            continue;
          }

          try {
            // Ejecutar scraping con Playwright
            // Debe devolver la ruta al archivo temporal generado para guardarlo en S3
            const path = await runScrapper(body);

            const uid = body.uid;
            // Guardar el resultado en almacenamiento de objetos como S3
            const publicUrl = await this.uploadScreenshot(path, uid);

            // Guardar la imagen del resultado y metadatos en la base de datos
            const result = await this.resultRepository.findByMessageId(body.messageId);

            if (!result) throw new NotFoundError("Result", body.messageId);

            result.update({ resultUrl: publicUrl });
            await this.resultRepository.update(result);

            // Eliminar mensaje después de scraping exitoso
            if (message.ReceiptHandle) {
              await this.scraperQueueService.deleteMessage(message.ReceiptHandle);
            }

            logger.info(`✅ Scraping completed`, {
              ...body,
              queueMessageId: message.MessageId,
            });
          } catch (error) {
            logger.error("Error processing scraper message:", { error, ...body });
            Sentry.captureException(error, {
              extra: {
                ...body,
                queueMessageId: message.MessageId,
              },
            });
            // No eliminar - dejar que reintente o vaya a DLQ
          }
        }
      }
    } catch (error) {
      logger.error("Error in scraper worker:", { error });
      Sentry.captureException(error, {
        extra: {
          worker: "scraper-worker",
        },
      });
    }
  }

  private async uploadScreenshot(screenshotPath: string, uid: string) {
    const fileBuffer = readFileSync(screenshotPath);
    const filename = `${uid}/${randomUUID()}.png`;

    const { data, error } = await supabase.storage.from("results").upload(filename, fileBuffer, {
      contentType: "image/png",
      upsert: false,
    });

    if (error) {
      console.log("Error subiendo archivo: ", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("results").getPublicUrl(data.path);

    return publicUrl;
  }
}
