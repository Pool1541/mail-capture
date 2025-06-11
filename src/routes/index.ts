import { Router } from "express";
import homeRouter from "./home.routes";
import emailRouter from "./email.routes";
import userRouter from "./user.routes";
import webhooksRouter from "./webhooks.routes";

const router: Router = Router();

router.use("/", homeRouter);
router.use("/api", emailRouter);
router.use("/", userRouter);
router.use("/auth", webhooksRouter);

export default router;
