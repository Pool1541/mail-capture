/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from "fs";
import * as path from "path";

import { type INotification } from "../domain/contracts/notification";
import type { NextFunction, Request, Response } from "express";

import { ServiceContainer } from "@/shared/infrastructure/service-container";
import { UnauthorizedSenderError } from "../domain/errors/unauthorized-sender-error";
import { MessageAlreadyProcessedError } from "../domain/errors/message-already-processed-error";

interface WebhookRequest extends Request {
  body: INotification;
}

export class ExpressResultController {
  emailClientWebhook(req: WebhookRequest, res: Response, next: NextFunction) {
    try {
      const validationToken = req.query.validationToken as string | undefined;

      if (validationToken) {
        console.log({ validationToken });
        res.status(200).type("text/plain").send(validationToken);
        return;
      }

      console.log("Received webhook notification:", req.body.value);

      const { clientState, resourceData } = req.body.value[0];
      const messageId = resourceData.id;

      if (clientState !== process.env.OUTLOOK_CLIENT_STATE) {
        console.log("Invalid client state:", { clientState, expected: process.env.OUTLOOK_CLIENT_STATE });
        res.status(400).json({ message: "Invalid client state" });
        return;
      }

      void ServiceContainer.result.ScrapeMessageIfNotExists.execute(messageId);

      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      // Este controlador no enviará estos errores al usuario ya que el caso de uso se está ejecutando síncronamente `void`
      // pero aún así se registrarán en los logs
      if (error instanceof MessageAlreadyProcessedError) {
        console.error(error.message);
        return;
      } else if (error instanceof UnauthorizedSenderError) {
        console.error(error.message);
        return;
      } else {
        console.log(error);
      }
    }
  }

  async getAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = await ServiceContainer.result.createAccessToken.execute();
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async requestWebhookSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookSubscriptionData = await ServiceContainer.result.createEmailClientWebhookSubscription.execute();

      console.log(webhookSubscriptionData);

      res.status(200).json({ message: "Webhook subscription created successfully", data: webhookSubscriptionData });
    } catch (error) {
      next(error);
    }
  }

  private saveLogFile(): void {
    try {
      const now = new Date();
      const timestamp = now.getTime().toString();
      const currentDateTime = now.toISOString().replace("T", " ").replace("Z", "");

      // Crear carpeta logs si no existe
      const logsDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Crear archivo con timestamp como nombre
      const fileName = `${timestamp}.txt`;
      const filePath = path.join(logsDir, fileName);

      // Contenido del archivo con la hora exacta
      const content = `Archivo creado el: ${currentDateTime}\nTimestamp: ${timestamp}`;

      fs.writeFileSync(filePath, content, "utf8");

      console.log(`Archivo de log guardado: ${filePath}`);
    } catch (error) {
      console.error("Error al guardar archivo de log:", error);
    }
  }
}
