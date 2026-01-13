import { Router } from "express";

import { ExpressAuthController } from "./express-auth-controller";

const controller = new ExpressAuthController();
const authRouter = Router();

authRouter.post("/webhook/sign-up", async (req, res, next) => {
  await controller.signUpWebhook(req, res, next);
});

export { authRouter };
