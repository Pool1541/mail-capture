import { Router } from "express";

import { authMiddleware } from "@/auth/infrastructure/middlewares/auth-middleware";
import { ExpressUserController } from "./express-user-controller";

const controller = new ExpressUserController();
const userRouter = Router();

userRouter.get("/:email", authMiddleware, async (req, res, next) => {
  await controller.findByEmail(req, res, next);
});

export { userRouter };
