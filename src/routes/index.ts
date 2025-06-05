import { Router } from "express";
import homeRouter from "./home.routes";
import emailRouter from "./email.routes";

const router: Router = Router();

router.use("/", homeRouter);
router.use("/api", emailRouter);

export default router;
