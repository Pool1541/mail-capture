import { Router } from "express";

import { ServiceContainer } from "@/shared/infrastructure/service-container";

const controller = ServiceContainer.controllers.resultController;
const resultRouter = Router();

resultRouter.get("/request-webhook", async (req, res, next) => {
  await controller.requestWebhookSubscription(req, res, next);
});

resultRouter.post("/webhook", (req, res, next) => {
  controller.emailClientWebhook(req, res, next);
});

resultRouter.get("/access-token", async (req, res, next) => {
  await controller.getAccessToken(req, res, next);
});

export { resultRouter };
