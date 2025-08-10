import { Router } from "express";

import { ExpressResultController } from "./express-result-controller";

const controller = new ExpressResultController();
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
