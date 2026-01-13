/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction, Request, Response } from "express";

import { ServiceContainer } from "@/shared/infrastructure/service-container";

export class ExpressAuthController {
  async signUpWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      console.log("Ejecutando webhook de actualización de usuario");

      await ServiceContainer.auth.signUpWebhook.execute(payload);
      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      next(error);
    }
  }
}
